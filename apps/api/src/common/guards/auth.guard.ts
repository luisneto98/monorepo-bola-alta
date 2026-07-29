import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_PENDING_KEY } from '../decorators/allow-pending.decorator';
import { User, UserDocument, UserStatus } from '../../users/schemas/user.schema';

export const TOKEN_COOKIE = 'ba_token';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Faça login para continuar.');

    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Sessão expirada. Entre novamente.');
    }

    const user = await this.userModel.findById(payload.sub).lean();
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');

    const allowPending = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PENDING_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!allowPending && user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException(
        user.status === UserStatus.PENDING
          ? 'Seu cadastro ainda está aguardando aprovação.'
          : 'Seu acesso foi recusado.',
      );
    }

    req['user'] = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    return true;
  }

  private extractToken(req: Request): string | undefined {
    const fromCookie = req.cookies?.[TOKEN_COOKIE];
    if (fromCookie) return fromCookie;
    const [type, value] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? value : undefined;
  }
}
