import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { SyncRosterDto } from './dto/sync-roster.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('scope') scope: 'upcoming' | 'past' | 'all' = 'upcoming',
    @Query('chatId') chatId?: string,
  ) {
    return this.games.list(scope, user.id, chatId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.games.findOne(id, user.id);
  }

  @Get(':id/invite')
  invite(@Param('id') id: string) {
    return this.games.invite(id, process.env.APP_URL ?? 'http://localhost:3000');
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateGameDto, @CurrentUser() user: AuthUser) {
    return this.games.create(dto, user.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGameDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.games.update(id, dto, user.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.games.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.games.cancel(id, reason, user.id);
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  @Post(':id/reopen')
  reopen(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.games.reopen(id, user.id);
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  @Post(':id/finish')
  finish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.games.finish(id, user.id);
  }

  // ----------------------------------------------------- Lista do WhatsApp

  /**
   * Reconcilia a pelada com a lista colada no grupo. Manda-se a lista COMPLETA;
   * quem não está nela sai. Use `dryRun` para conferir antes de gravar.
   */
  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  @Post(':id/roster')
  syncRoster(
    @Param('id') id: string,
    @Body() dto: SyncRosterDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.games.syncRoster(id, dto, admin.id);
  }

  /** Presenças de convidado com nome parecido — candidatas a vincular a uma conta. */
  @Roles(UserRole.ADMIN)
  @Get('guests/candidates/:userId')
  guestCandidates(@Param('userId') userId: string) {
    return this.games.guestCandidates(userId);
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  @Post('guests/claim/:userId')
  claimGuest(
    @Param('userId') userId: string,
    @Body('attendanceIds') attendanceIds: string[],
  ) {
    return this.games.claimGuest(userId, attendanceIds ?? []);
  }

  // ---------------------------------------------------------- Presença

  @HttpCode(200)
  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.games.join(id, user.id);
  }

  @HttpCode(200)
  @Post(':id/leave')
  leave(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.games.leave(id, user.id);
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  @Post(':id/players/:userId')
  addPlayer(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.games.addPlayer(id, userId, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id/players/:userId')
  removePlayer(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.games.removePlayer(id, userId, admin.id);
  }

  // ---------------------------------------------------------- Pagamento

  @Roles(UserRole.ADMIN)
  @Patch(':id/players/:userId/payment')
  setPaid(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('paid') paid: boolean,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.games.setPaid(id, userId, paid, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/players/:userId/no-show')
  setNoShow(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('noShow') noShow: boolean,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.games.setNoShow(id, userId, noShow, admin.id);
  }
}
