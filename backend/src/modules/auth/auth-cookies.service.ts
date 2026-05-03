import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

export const ACCESS_COOKIE = 'kappio_access';
export const REFRESH_COOKIE = 'kappio_refresh';

@Injectable()
export class AuthCookiesService {
  constructor(private readonly configService: ConfigService) {}

  private get isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private cookieBasePath(): string {
    return this.configService.get<string>('AUTH_COOKIE_PATH') ?? '/';
  }

  clearAuthCookies(res: Response): void {
    const p = this.cookieBasePath();
    res.clearCookie(ACCESS_COOKIE, { path: p });
    res.clearCookie(REFRESH_COOKIE, { path: p });
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const maxAgeAccessSec = this.parseDurationToSeconds(
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m',
      900,
    );
    const maxAgeRefreshSec = this.parseDurationToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      604800,
    );

    const secure = true; // Required for cross-domain cookies
    const sameSite = 'none'; // Required for cross-domain cookies (vercel.app <-> railway.app)

    const base = {
      httpOnly: true,
      secure,
      sameSite,
      path: this.cookieBasePath(),
    } as const;

    res.cookie(ACCESS_COOKIE, accessToken, {
      ...base,
      maxAge: maxAgeAccessSec * 1000,
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...base,
      maxAge: maxAgeRefreshSec * 1000,
    });
  }

  /** Parses simple tokens like 15m, 7d, 24h into seconds */
  private parseDurationToSeconds(raw: string, fallback: number): number {
    const m = /^(\d+)(ms|s|m|h|d)$/i.exec(raw.trim());
    if (!m) {
      return fallback;
    }
    const n = Number(m[1]);
    const u = m[2].toLowerCase();
    const mult: Record<string, number> = {
      ms: 0.001,
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return Math.floor(n * (mult[u] ?? 60));
  }
}
