import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Role } from '../../database/entities/role.entity';
import { User } from '../../database/entities/user.entity';
import { Otp } from '../../database/entities/otp.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { AuthTokensService } from './auth-tokens.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly authTokensService: AuthTokensService,
  ) {}

  private buildUserPayload(user: User) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      fullName: user.fullName,
    };
  }

  async issueTokenPairForUser(user: User) {
    const payload = this.buildUserPayload(user);
    const accessToken = await this.authTokensService.signAccess(payload);
    const refreshToken = await this.authTokensService.signRefresh(user.id);
    return { user: payload, accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email, active: true },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Account setup is not complete. Open the invite link you received to set a password.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPairForUser(user);
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('An account with this email already exists');
      }
      throw new ConflictException('An account with this phone number already exists');
    }

    const role = await this.rolesRepository.findOne({
      where: { name: UserRole.CUSTOMER },
    });
    if (!role) {
      throw new ServiceUnavailableException(
        'Customer role is not configured. Seed roles in the database.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role,
      roleId: role.id,
      active: true,
    });
    await this.usersRepository.save(user);

    const saved = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: ['role'],
    });
    if (!saved) {
      throw new UnauthorizedException('Registration failed');
    }

    return this.issueTokenPairForUser(saved);
  }

  async refreshFromRefreshToken(refreshToken: string) {
    try {
      const { sub } = await this.authTokensService.verifyRefresh(refreshToken);
      const user = await this.usersRepository.findOne({
        where: { id: sub, active: true },
        relations: ['role'],
      });
      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('Invalid session');
      }
      return this.issueTokenPairForUser(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getInvitePreview(token: string) {
    const user = await this.usersRepository.findOne({
      where: { inviteToken: token },
      relations: ['role'],
    });
    if (!user || !user.inviteExpiresAt) {
      throw new NotFoundException('Invalid or expired invitation');
    }
    if (user.inviteExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invitation has expired');
    }
    return {
      valid: true,
      fullName: user.fullName,
      email: user.email,
      role: user.role.name,
    };
  }

  async setPassword(dto: SetPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { inviteToken: dto.token },
      relations: ['role'],
    });
    if (!user || !user.inviteExpiresAt) {
      throw new NotFoundException('Invalid or expired invitation');
    }
    if (user.inviteExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invitation has expired');
    }
    if (user.passwordHash) {
      throw new ConflictException('Password has already been set for this account');
    }

    user.passwordHash = await bcrypt.hash(dto.password, 10);
    user.inviteToken = null;
    user.inviteExpiresAt = null;
    await this.usersRepository.save(user);

    const saved = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: ['role'],
    });
    if (!saved) {
      throw new UnauthorizedException('Unable to complete setup');
    }

    return this.issueTokenPairForUser(saved);
  }

  async socketHandshakeToken(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, active: true },
      relations: ['role'],
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException();
    }
    const payload = this.buildUserPayload(user);
    const accessToken = await this.authTokensService.signAccess(payload);
    return { token: accessToken };
  }

  async sendOtp(phone: string) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await this.otpRepository.delete({ phone }); // Clear old ones
    const otp = this.otpRepository.create({ phone, code, expiresAt });
    await this.otpRepository.save(otp);

    // In a real app, send via SMS gateway here
    console.log(`[OTP] Sent ${code} to ${phone}`);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, code: string) {
    const otp = await this.otpRepository.findOne({
      where: { phone, code, isUsed: false },
    });

    if (!otp) {
      return { verified: false, message: 'Invalid OTP' };
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      return { verified: false, message: 'OTP expired' };
    }

    otp.isUsed = true;
    await this.otpRepository.save(otp);
    return { verified: true, message: 'OTP verified' };
  }
}
