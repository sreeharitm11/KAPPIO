import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Role } from '../../database/entities/role.entity';
import { User } from '../../database/entities/user.entity';
import { CreateTeamInvitationDto } from './dto/create-team-invitation.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly configService: ConfigService,
  ) {}

  async listTeamMembers() {
    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where('role.name IN (:...roles)', {
        roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.DELIVERY],
      })
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return rows.map((u) => this.toPublicMember(u));
  }

  async createTeamInvitation(dto: CreateTeamInvitationDto) {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('A user with this email already exists');
      }
      throw new ConflictException('A user with this phone number already exists');
    }

    const role = await this.rolesRepository.findOne({
      where: { name: dto.role },
    });
    if (!role) {
      throw new ServiceUnavailableException(
        `Role ${dto.role} is not configured. Seed roles in the database.`,
      );
    }

    const token = randomBytes(24).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = this.usersRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash: null,
      inviteToken: token,
      inviteExpiresAt,
      role,
      roleId: role.id,
      active: true,
    });
    await this.usersRepository.save(user);

    const base =
      this.configService.get<string>('FRONTEND_ORIGIN') ??
      this.configService.get<string>('INVITE_PUBLIC_ORIGIN') ??
      'http://localhost:5173';
    const invitePath =
      this.configService.get<string>('INVITE_PATH') ?? '/invite/setup-password';
    const inviteUrl = `${base.replace(/\/$/, '')}${invitePath}?token=${encodeURIComponent(token)}`;

    return {
      ...this.toPublicMember(await this.usersRepository.findOneOrFail({ where: { id: user.id }, relations: ['role'] })),
      inviteUrl,
      inviteExpiresAt: inviteExpiresAt.toISOString(),
    };
  }

  async updateMember(id: string, dto: any) {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    Object.assign(user, dto);
    await this.usersRepository.save(user);
    return this.toPublicMember(user);
  }

  async deleteMember(id: string) {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    user.active = false; // Soft delete/Deactivate
    await this.usersRepository.save(user);
    return { success: true };
  }

  private toPublicMember(user: User) {
    const pendingInvite = Boolean(
      !user.passwordHash && user.inviteToken && user.inviteExpiresAt,
    );
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role?.name,
      active: user.active,
      aadhaar: user.aadhaar,
      doj: user.doj,
      emergencyContact: user.emergencyContact,
      pendingInvite,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
