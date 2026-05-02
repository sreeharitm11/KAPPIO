import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/enums/user-role.enum';

export type AccessPayload = {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
};

@Injectable()
export class AuthTokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signAccess(payload: AccessPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async signRefresh(userId: string): Promise<string> {
    const secret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    return this.jwtService.signAsync(
      { sub: userId, typ: 'refresh' },
      { secret, expiresIn: expiresIn as `${number}ms` | `${number}s` | `${number}m` | `${number}h` | `${number}d` },
    );
  }

  async verifyRefresh(token: string): Promise<{ sub: string }> {
    const secret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      typ?: string;
    }>(token, { secret });
    if (payload.typ !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    return { sub: payload.sub };
  }

  async verifyAccessTokenString(token: string): Promise<AccessPayload> {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return this.jwtService.verifyAsync<AccessPayload>(token, { secret });
  }
}
