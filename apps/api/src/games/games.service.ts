import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Game, GameDocument, GameStatus } from './schemas/game.schema';
import {
  Attendance,
  AttendanceDocument,
  AttendanceStatus,
} from './schemas/attendance.schema';
import { User, UserDocument, UserStatus } from '../users/schemas/user.schema';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PushService } from '../push/push.service';
import { buildInviteMessage } from './invite-message';

export interface GameView {
  id: string;
  title: string;
  date: Date;
  durationMinutes: number;
  location: Game['location'];
  minPlayers: number;
  maxPlayers: number;
  cost: number;
  status: GameStatus;
  notes?: string;
  cancelReason?: string;
  confirmedCount: number;
  waitlistCount: number;
  spotsLeft: number;
  missingToConfirm: number;
  costPerPlayer: number;
  paidCount: number;
  totalPaid: number;
  /** Situação de quem está pedindo a lista. */
  me: {
    status: AttendanceStatus | null;
    paid: boolean;
    waitlistPosition: number | null;
  };
}

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly push: PushService,
  ) {}

  // ---------------------------------------------------------------- CRUD

  async create(dto: CreateGameDto, adminId: string) {
    const min = dto.minPlayers ?? 12;
    const max = dto.maxPlayers ?? 18;
    if (max < min) {
      throw new BadRequestException('O máximo não pode ser menor que o mínimo.');
    }

    const game = await this.gameModel.create({
      ...dto,
      date: new Date(dto.date),
      minPlayers: min,
      maxPlayers: max,
      createdBy: adminId,
      status: GameStatus.PENDING,
    });

    await this.push.broadcast(
      {
        title: '🏐 Nova pelada marcada!',
        body: `${game.title} — ${this.formatShort(game.date)} em ${game.location.name}`,
        url: `/peladas/${game._id}`,
      },
      { exceptUserId: adminId },
    );

    return this.toView(game.toObject(), adminId);
  }

  async update(id: string, dto: UpdateGameDto, userId: string) {
    const game = await this.gameModel.findById(id);
    if (!game) throw new NotFoundException('Pelada não encontrada.');

    const min = dto.minPlayers ?? game.minPlayers;
    const max = dto.maxPlayers ?? game.maxPlayers;
    if (max < min) {
      throw new BadRequestException('O máximo não pode ser menor que o mínimo.');
    }

    Object.assign(game, dto, dto.date ? { date: new Date(dto.date) } : {});
    await game.save();

    // Mexer no mínimo/máximo pode mudar quem está dentro e o status.
    await this.rebalance(game);
    return this.findOne(id, userId);
  }

  async remove(id: string) {
    await this.attendanceModel.deleteMany({ game: new Types.ObjectId(id) });
    await this.gameModel.findByIdAndDelete(id);
    return { ok: true };
  }

  async cancel(id: string, reason: string | undefined, userId: string) {
    const game = await this.gameModel.findById(id);
    if (!game) throw new NotFoundException('Pelada não encontrada.');

    game.status = GameStatus.CANCELED;
    game.canceledAt = new Date();
    game.cancelReason = reason;
    await game.save();

    const players = await this.attendanceModel
      .find({ game: game._id, status: { $ne: AttendanceStatus.OUT } })
      .lean();

    await this.push.sendToUsers(
      players.map((p) => String(p.user)),
      {
        title: '❌ Pelada cancelada',
        body: `${game.title} — ${this.formatShort(game.date)}${reason ? `: ${reason}` : ''}`,
        url: `/peladas/${game._id}`,
      },
    );

    return this.findOne(id, userId);
  }

  async reopen(id: string, userId: string) {
    const game = await this.gameModel.findById(id);
    if (!game) throw new NotFoundException('Pelada não encontrada.');

    game.canceledAt = undefined;
    game.cancelReason = undefined;
    await game.save();
    await this.rebalance(game);
    return this.findOne(id, userId);
  }

  async finish(id: string, userId: string) {
    const game = await this.gameModel.findByIdAndUpdate(
      id,
      { status: GameStatus.FINISHED },
      { new: true },
    );
    if (!game) throw new NotFoundException('Pelada não encontrada.');
    return this.findOne(id, userId);
  }

  // ---------------------------------------------------------------- Leitura

  async list(scope: 'upcoming' | 'past' | 'all', userId: string) {
    const now = new Date();
    const filter =
      scope === 'upcoming'
        ? { date: { $gte: now }, status: { $ne: GameStatus.FINISHED } }
        : scope === 'past'
          ? { $or: [{ date: { $lt: now } }, { status: GameStatus.FINISHED }] }
          : {};

    const games = await this.gameModel
      .find(filter)
      .sort({ date: scope === 'past' ? -1 : 1 })
      .lean();

    return Promise.all(games.map((g) => this.toView(g, userId)));
  }

  async findOne(id: string, userId: string) {
    const game = await this.gameModel.findById(id).lean();
    if (!game) throw new NotFoundException('Pelada não encontrada.');

    const view = await this.toView(game, userId);
    const players = await this.playersOf(id);

    return {
      ...view,
      confirmed: players.filter((p) => p.status === AttendanceStatus.CONFIRMED),
      waitlist: players.filter((p) => p.status === AttendanceStatus.WAITLIST),
      out: players.filter((p) => p.status === AttendanceStatus.OUT),
    };
  }

  /** Texto pronto para colar no WhatsApp. */
  async invite(id: string, baseUrl: string) {
    const game = await this.gameModel.findById(id).lean();
    if (!game) throw new NotFoundException('Pelada não encontrada.');

    const players = await this.playersOf(id);
    const confirmed = players.filter((p) => p.status === AttendanceStatus.CONFIRMED);
    const waitlist = players.filter((p) => p.status === AttendanceStatus.WAITLIST);

    const message = buildInviteMessage({
      game,
      confirmed,
      waitlist,
      costPerPlayer: this.costPerPlayer(game.cost, confirmed.length),
      url: `${baseUrl.replace(/\/$/, '')}/peladas/${game._id}`,
    });

    return { message };
  }

  // ------------------------------------------------------- Presença

  async join(gameId: string, userId: string) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Pelada não encontrada.');
    if (game.status === GameStatus.CANCELED) {
      throw new BadRequestException('Essa pelada foi cancelada.');
    }
    if (game.status === GameStatus.FINISHED) {
      throw new BadRequestException('Essa pelada já aconteceu.');
    }

    const confirmedCount = await this.countBy(gameId, AttendanceStatus.CONFIRMED);
    const goesToWaitlist = confirmedCount >= game.maxPlayers;

    await this.attendanceModel.findOneAndUpdate(
      { game: game._id, user: new Types.ObjectId(userId) },
      {
        $set: {
          status: goesToWaitlist
            ? AttendanceStatus.WAITLIST
            : AttendanceStatus.CONFIRMED,
          noShow: false,
        },
        $setOnInsert: { joinedAt: new Date() },
      },
      { upsert: true, new: true },
    );

    await this.refreshStatus(game);
    return this.findOne(gameId, userId);
  }

  async leave(gameId: string, userId: string) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Pelada não encontrada.');

    const attendance = await this.attendanceModel.findOne({
      game: game._id,
      user: new Types.ObjectId(userId),
    });
    if (!attendance) throw new BadRequestException('Você não está nessa pelada.');
    if (attendance.paid) {
      throw new BadRequestException(
        'Você já pagou essa pelada — fale com o organizador para sair.',
      );
    }

    attendance.status = AttendanceStatus.OUT;
    await attendance.save();

    await this.promoteFromWaitlist(game);
    await this.refreshStatus(game);
    return this.findOne(gameId, userId);
  }

  /** Admin coloca alguém na pelada (quem avisou por fora). */
  async addPlayer(gameId: string, targetUserId: string, requesterId: string) {
    const user = await this.userModel.findById(targetUserId).lean();
    if (!user || user.status !== UserStatus.APPROVED) {
      throw new BadRequestException('Jogador inválido ou não aprovado.');
    }
    await this.join(gameId, targetUserId);
    return this.findOne(gameId, requesterId);
  }

  /** Admin tira alguém da pelada. */
  async removePlayer(gameId: string, targetUserId: string, requesterId: string) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Pelada não encontrada.');

    await this.attendanceModel.findOneAndUpdate(
      { game: game._id, user: new Types.ObjectId(targetUserId) },
      { status: AttendanceStatus.OUT, paid: false, paidAt: null },
    );

    await this.promoteFromWaitlist(game);
    await this.refreshStatus(game);
    return this.findOne(gameId, requesterId);
  }

  // ------------------------------------------------------- Pagamento

  async setPaid(
    gameId: string,
    targetUserId: string,
    paid: boolean,
    adminId: string,
  ) {
    const attendance = await this.attendanceModel.findOneAndUpdate(
      { game: new Types.ObjectId(gameId), user: new Types.ObjectId(targetUserId) },
      paid
        ? { paid: true, paidAt: new Date(), paidBy: adminId }
        : { paid: false, paidAt: null, paidBy: null },
      { new: true },
    );
    if (!attendance) throw new NotFoundException('Jogador não está nessa pelada.');
    return this.findOne(gameId, adminId);
  }

  async setNoShow(
    gameId: string,
    targetUserId: string,
    noShow: boolean,
    adminId: string,
  ) {
    await this.attendanceModel.findOneAndUpdate(
      { game: new Types.ObjectId(gameId), user: new Types.ObjectId(targetUserId) },
      { noShow },
    );
    return this.findOne(gameId, adminId);
  }

  // ------------------------------------------------------- Internos

  /** Promove quem está na espera enquanto houver vaga, na ordem de chegada. */
  private async promoteFromWaitlist(game: GameDocument) {
    let confirmed = await this.countBy(String(game._id), AttendanceStatus.CONFIRMED);

    while (confirmed < game.maxPlayers) {
      const next = await this.attendanceModel
        .findOne({ game: game._id, status: AttendanceStatus.WAITLIST })
        .sort({ joinedAt: 1 });
      if (!next) break;

      next.status = AttendanceStatus.CONFIRMED;
      await next.save();
      confirmed += 1;

      await this.push.sendToUsers([String(next.user)], {
        title: '🎉 Abriu vaga pra você!',
        body: `Você saiu da lista de espera de ${game.title} — ${this.formatShort(game.date)}`,
        url: `/peladas/${game._id}`,
      });
    }
  }

  /** Se mexeram no mín./máx., rebalanceia confirmados x espera e o status. */
  private async rebalance(game: GameDocument) {
    const confirmed = await this.attendanceModel
      .find({ game: game._id, status: AttendanceStatus.CONFIRMED })
      .sort({ joinedAt: 1 });

    // Excedentes voltam para a espera (os últimos a chegar).
    for (const extra of confirmed.slice(game.maxPlayers)) {
      extra.status = AttendanceStatus.WAITLIST;
      await extra.save();
    }

    await this.promoteFromWaitlist(game);
    await this.refreshStatus(game);
  }

  /** PENDING ↔ CONFIRMED conforme o mínimo. Não mexe em cancelada/encerrada. */
  private async refreshStatus(game: GameDocument) {
    if (game.status === GameStatus.CANCELED && game.canceledAt) return;
    if (game.status === GameStatus.FINISHED) return;

    const confirmed = await this.countBy(String(game._id), AttendanceStatus.CONFIRMED);
    const next =
      confirmed >= game.minPlayers ? GameStatus.CONFIRMED : GameStatus.PENDING;

    if (next === game.status) return;

    game.status = next;
    await game.save();

    if (next === GameStatus.CONFIRMED) {
      const players = await this.attendanceModel
        .find({ game: game._id, status: AttendanceStatus.CONFIRMED })
        .lean();
      await this.push.sendToUsers(
        players.map((p) => String(p.user)),
        {
          title: '✅ Pelada confirmada!',
          body: `${game.title} — ${this.formatShort(game.date)} bateu o mínimo de ${game.minPlayers} jogadores.`,
          url: `/peladas/${game._id}`,
        },
      );
    }
  }

  private countBy(gameId: string, status: AttendanceStatus) {
    return this.attendanceModel.countDocuments({
      game: new Types.ObjectId(gameId),
      status,
    });
  }

  private async playersOf(gameId: string) {
    const rows = await this.attendanceModel
      .find({ game: new Types.ObjectId(gameId) })
      .sort({ joinedAt: 1 })
      .populate('user', 'name email phone position level')
      .lean();

    return rows
      .filter((r) => r.user)
      .map((r, index) => ({
        userId: String((r.user as any)._id),
        name: (r.user as any).name,
        phone: (r.user as any).phone,
        position: (r.user as any).position,
        level: (r.user as any).level,
        status: r.status,
        paid: r.paid,
        paidAt: r.paidAt,
        noShow: r.noShow,
        joinedAt: r.joinedAt,
        order: index + 1,
      }));
  }

  private costPerPlayer(cost: number, confirmedCount: number) {
    if (!cost || confirmedCount === 0) return 0;
    return Math.ceil((cost / confirmedCount) * 100) / 100;
  }

  private async toView(game: any, userId: string): Promise<GameView> {
    const gameId = String(game._id);
    const rows = await this.attendanceModel.find({ game: game._id }).lean();

    const confirmed = rows.filter((r) => r.status === AttendanceStatus.CONFIRMED);
    const waitlist = rows
      .filter((r) => r.status === AttendanceStatus.WAITLIST)
      .sort((a, b) => +a.joinedAt - +b.joinedAt);

    const mine = rows.find((r) => String(r.user) === userId);
    const waitlistPosition =
      mine?.status === AttendanceStatus.WAITLIST
        ? waitlist.findIndex((r) => String(r.user) === userId) + 1
        : null;

    const paid = confirmed.filter((r) => r.paid);
    const costPerPlayer = this.costPerPlayer(game.cost, confirmed.length);

    return {
      id: gameId,
      title: game.title,
      date: game.date,
      durationMinutes: game.durationMinutes,
      location: game.location,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      cost: game.cost,
      status: game.status,
      notes: game.notes,
      cancelReason: game.cancelReason,
      confirmedCount: confirmed.length,
      waitlistCount: waitlist.length,
      spotsLeft: Math.max(0, game.maxPlayers - confirmed.length),
      missingToConfirm: Math.max(0, game.minPlayers - confirmed.length),
      costPerPlayer,
      paidCount: paid.length,
      totalPaid: Math.round(paid.length * costPerPlayer * 100) / 100,
      me: {
        status: mine?.status ?? null,
        paid: mine?.paid ?? false,
        waitlistPosition,
      },
    };
  }

  private formatShort(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: process.env.APP_TIMEZONE ?? 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
