import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly authTokensService: AuthTokensService,
    private readonly configService: ConfigService,
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

  async sendOtp(email: string) {
    const existing = await this.otpRepository.findOne({ where: { email } });
    if (existing) {
      const diffMs = Date.now() - existing.lastSentAt.getTime();
      if (diffMs < 30000) {
        throw new BadRequestException(`Please wait ${Math.ceil((30000 - diffMs) / 1000)}s before resending.`);
      }
    }

    const plainCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const codeHash = await bcrypt.hash(plainCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.otpRepository.delete({ email }); // clear previous OTPs for this email
    await this.otpRepository.save(
      this.otpRepository.create({ email, codeHash, expiresAt, attempts: 0, lastSentAt: new Date() }),
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.getOrThrow<string>('GMAIL_USER'),
        pass: this.configService.getOrThrow<string>('GMAIL_APP_PASSWORD'),
      },
    });

    await transporter.sendMail({
      from: `"Kappio Cafe" <${this.configService.get('GMAIL_USER')}>`,
      to: email,
      subject: 'Your Kappio Cafe OTP',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e8dcc8;border-radius:12px">
          <h2 style="color:#2C1810">Kappio Cafe®</h2>
          <p style="color:#6B5D52">Your one-time password is:</p>
          <div style="font-size:36px;font-weight:900;color:#B85C3E;letter-spacing:8px;text-align:center;padding:16px 0">${plainCode}</div>
          <p style="color:#9E8E81;font-size:12px">Expires in 5 minutes. Do not share this code.</p>
        </div>`,
    });

    this.logger.log(`OTP sent to ...${email.slice(-8)}`);
    return { message: 'OTP sent to your email' };
  }

  async verifyOtp(email: string, code: string) {
    const MAX_ATTEMPTS = 5;
    const otp = await this.otpRepository.findOne({
      where: { email, isUsed: false },
    });

    if (!otp) {
      return { verified: false, message: 'No active OTP found' };
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      await this.otpRepository.delete({ email });
      return { verified: false, message: 'OTP expired' };
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await this.otpRepository.delete({ email });
      return { verified: false, message: 'Too many attempts. Request a new OTP.' };
    }

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      otp.attempts += 1;
      await this.otpRepository.save(otp);
      return { verified: false, message: `Invalid OTP. ${MAX_ATTEMPTS - otp.attempts} attempt(s) remaining.` };
    }

    otp.isUsed = true;
    await this.otpRepository.save(otp);
    return { verified: true, message: 'OTP verified' };
  }
}
