import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user as AuthUser | undefined;
  },
);
