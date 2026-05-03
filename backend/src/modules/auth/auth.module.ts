import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../database/entities/role.entity';
import { User } from '../../database/entities/user.entity';
import { Otp } from '../../database/entities/otp.entity';
import { AuthCookiesService } from './auth-cookies.service';
import { AuthTokensService } from './auth-tokens.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SeedService } from './seed.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { OtpCleanupService } from './otp-cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Otp]),
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthTokensService, AuthCookiesService, SeedService, OtpCleanupService],
  exports: [AuthService, AuthTokensService],
})
export class AuthModule {}
