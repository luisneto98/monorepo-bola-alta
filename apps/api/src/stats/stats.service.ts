import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Game, GameDocument, GameStatus } from '../games/schemas/game.schema';
import {
  Attendance,
  AttendanceDocument,
  AttendanceStatus,
} from '../games/schemas/attendance.schema';
import { User, UserDocument, UserStatus } from '../users/schemas/user.schema';

export interface RankingRow {
  userId: string;
  name: string;
  played: number;
  noShows: number;
  withdrawals: number;
  attendanceRate: number;
  pendingAmount: number;
  pendingGames: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /** Ranking de presença + o que cada um está devendo. */
  async ranking() {
    const now = new Date();

    // Peladas que já aconteceram e não foram canceladas.
    const games = await this.gameModel
      .find({
        status: { $ne: GameStatus.CANCELED },
        $or: [{ date: { $lt: now } }, { status: GameStatus.FINISHED }],
      })
      .lean();

    const gameById = new Map(games.map((g) => [String(g._id), g]));
    const gameIds = games.map((g) => g._id);

    const rows = await this.attendanceModel
      .find({ game: { $in: gameIds } })
      .lean();

    // Rateio de cada pelada = custo ÷ confirmados daquela pelada.
    const confirmedPerGame = new Map<string, number>();
    for (const row of rows) {
      if (row.status !== AttendanceStatus.CONFIRMED) continue;
      const key = String(row.game);
      confirmedPerGame.set(key, (confirmedPerGame.get(key) ?? 0) + 1);
    }

    const users = await this.userModel
      .find({ status: UserStatus.APPROVED })
      .lean();

    const stats = new Map<string, RankingRow>(
      users.map((u) => [
        String(u._id),
        {
          userId: String(u._id),
          name: u.name,
          played: 0,
          noShows: 0,
          withdrawals: 0,
          attendanceRate: 0,
          pendingAmount: 0,
          pendingGames: 0,
        },
      ]),
    );

    for (const row of rows) {
      const entry = stats.get(String(row.user));
      if (!entry) continue;

      if (row.status === AttendanceStatus.OUT) {
        entry.withdrawals += 1;
        continue;
      }
      if (row.status !== AttendanceStatus.CONFIRMED) continue;

      if (row.noShow) {
        entry.noShows += 1;
      } else {
        entry.played += 1;
      }

      if (!row.paid) {
        const game = gameById.get(String(row.game));
        const confirmed = confirmedPerGame.get(String(row.game)) ?? 0;
        if (game?.cost && confirmed > 0) {
          entry.pendingAmount +=
            Math.ceil((game.cost / confirmed) * 100) / 100;
          entry.pendingGames += 1;
        }
      }
    }

    const total = games.length || 1;
    const ranking = [...stats.values()].map((row) => ({
      ...row,
      pendingAmount: Math.round(row.pendingAmount * 100) / 100,
      attendanceRate: Math.round((row.played / total) * 100),
    }));

    ranking.sort((a, b) => b.played - a.played || a.name.localeCompare(b.name));

    return { totalGames: games.length, ranking };
  }

  /** Resumo do painel do admin. */
  async summary() {
    const now = new Date();

    const [pendingUsers, upcoming, ranking] = await Promise.all([
      this.userModel.countDocuments({ status: UserStatus.PENDING }),
      this.gameModel.countDocuments({
        date: { $gte: now },
        status: { $in: [GameStatus.PENDING, GameStatus.CONFIRMED] },
      }),
      this.ranking(),
    ]);

    const totalPending = ranking.ranking.reduce(
      (sum, row) => sum + row.pendingAmount,
      0,
    );

    return {
      pendingUsers,
      upcomingGames: upcoming,
      finishedGames: ranking.totalGames,
      totalPendingAmount: Math.round(totalPending * 100) / 100,
      debtors: ranking.ranking
        .filter((r) => r.pendingAmount > 0)
        .sort((a, b) => b.pendingAmount - a.pendingAmount),
    };
  }

  /** Histórico individual: em que peladas a pessoa esteve e o que deve. */
  async myHistory(userId: string) {
    const rows = await this.attendanceModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('game')
      .sort({ createdAt: -1 })
      .lean();

    return rows
      .filter((r) => r.game)
      .map((r) => {
        const game = r.game as any;
        return {
          gameId: String(game._id),
          title: game.title,
          date: game.date,
          gameStatus: game.status,
          status: r.status,
          paid: r.paid,
          noShow: r.noShow,
        };
      });
  }
}
