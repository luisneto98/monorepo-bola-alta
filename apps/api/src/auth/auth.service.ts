import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.users.create(dto);
    return { user: this.sanitize(user), token: await this.sign(String(user._id)) };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('E-mail ou senha incorretos.');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('E-mail ou senha incorretos.');

    return { user: this.sanitize(user), token: await this.sign(String(user._id)) };
  }

  async me(id: string) {
    return this.sanitize(await this.users.findById(id));
  }

  private sign(sub: string) {
    return this.jwt.signAsync({ sub });
  }

  private sanitize(user: Record<string, any>) {
    const { passwordHash, __v, ...rest } = user;
    return { ...rest, id: String(user._id) };
  }
}
