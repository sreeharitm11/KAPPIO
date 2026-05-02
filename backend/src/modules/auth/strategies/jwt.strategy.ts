import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ACCESS_COOKIE } from '../auth-cookies.service';
import { AuthUser } from '../../../shared/interfaces/auth-user.interface';

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const fromCookie = req?.cookies?.[ACCESS_COOKIE];
          if (typeof fromCookie === 'string' && fromCookie.length > 0) {
            return fromCookie;
          }
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return payload;
  }
}
