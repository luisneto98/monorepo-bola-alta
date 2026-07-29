import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UserRole, UserStatus } from './schemas/user.schema';
import { Roles } from '../common/decorators/roles.decorator';
import { AllowPending } from '../common/decorators/allow-pending.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  list(@Query('status') status?: UserStatus) {
    return this.users.list(status);
  }

  /** Lista simples de aprovados — qualquer jogador logado pode ver a turma. */
  @Get('community')
  community() {
    return this.users.listApproved();
  }

  @AllowPending()
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @AllowPending()
  @Patch('me/password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() admin: AuthUser) {
    return this.users.setStatus(id, UserStatus.APPROVED, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() admin: AuthUser) {
    return this.users.setStatus(id, UserStatus.REJECTED, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  setRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.users.setRole(id, role, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() admin: AuthUser) {
    return this.users.remove(id, admin.id);
  }
}
