import { Controller, Get } from '@nestjs/common';

import { StatsService } from './stats.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('ranking')
  ranking() {
    return this.stats.ranking();
  }

  @Get('me')
  myHistory(@CurrentUser() user: AuthUser) {
    return this.stats.myHistory(user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get('summary')
  summary() {
    return this.stats.summary();
  }
}
