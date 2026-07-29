import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
