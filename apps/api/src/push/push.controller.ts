import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';

import { PushService } from './push.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Public()
  @Get('public-key')
  publicKey() {
    return { publicKey: this.push.publicKey };
  }

  @HttpCode(200)
  @Post('subscribe')
  subscribe(
    @CurrentUser() user: AuthUser,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
    @Headers('user-agent') userAgent: string,
  ) {
    return this.push.subscribe(user.id, body, userAgent);
  }

  @HttpCode(200)
  @Post('unsubscribe')
  unsubscribe(@Body('endpoint') endpoint: string) {
    return this.push.unsubscribe(endpoint);
  }

  /** Recado geral da comunidade. */
  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  @Post('broadcast')
  async broadcast(@Body() body: { title: string; message: string; url?: string }) {
    await this.push.broadcast({
      title: body.title,
      body: body.message,
      url: body.url,
    });
    return { ok: true };
  }
}
