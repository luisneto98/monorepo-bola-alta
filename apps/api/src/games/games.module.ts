import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Game, GameSchema } from './schemas/game.schema';
import { Attendance, AttendanceSchema } from './schemas/attendance.schema';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: Attendance.name, schema: AttendanceSchema },
    ]),
    PushModule,
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [MongooseModule],
})
export class GamesModule {}
