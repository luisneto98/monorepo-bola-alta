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
import { SyncRosterDto } from './dto/sync-roster.dto';
import { firstNameKey, nameKey } from '../common/name-key';
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
      // Convidados não têm conta, logo não têm push.
      players.filter((p) => p.user).map((p) => String(p.user)),
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

  // -------------------------------------------------- Lista do WhatsApp

  /**
   * Reconcilia a pelada com a lista COMPLETA colada no grupo.
   *
   * A lista é reenviada atualizada várias vezes por semana, então ela manda: quem
   * está nela fica, quem saiu vira OUT (jogador) ou some (convidado). Isso torna a
   * operação idempotente — rodar duas vezes com a mesma lista não muda nada.
   *
   * Nomes são casados com jogadores cadastrados; o que não casa vira convidado.
   * Com `dryRun`, nada é gravado e o retorno serve para confirmação no grupo.
   */
  async syncRoster(gameId: string, dto: SyncRosterDto, adminId: string) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Pelada não encontrada.');
    if (game.status === GameStatus.CANCELED) {
      throw new BadRequestException('Essa pelada foi cancelada.');
    }

    const users = await this.userModel
      .find({ status: UserStatus.APPROVED })
      .select('name')
      .lean();

    // Um nome pode casar com mais de um cadastrado; guardamos todos para detectar
    // ambiguidade em vez de escolher no chute.
    const byName = new Map<string, typeof users>();
    for (const u of users) {
      for (const key of new Set([nameKey(u.name), firstNameKey(u.name)])) {
        if (!key) continue;
        byName.set(key, [...(byName.get(key) ?? []), u]);
      }
    }

    const takenUsers = new Set<string>();
    const resolved: Array<{
      entry: (typeof dto.entries)[number];
      key: string;
      user: { _id: any; name: string } | null;
      ambiguousWith?: string[];
    }> = [];

    for (const entry of dto.entries) {
      const key = nameKey(entry.name);
      const candidates = (byName.get(key) ?? byName.get(firstNameKey(entry.name)) ?? [])
        // Dois "Eduardo" na lista e um só cadastrado: o primeiro leva a conta, o
        // segundo vira convidado. Sem isso, um sobrescreveria o outro.
        .filter((u) => !takenUsers.has(String(u._id)));

      if (candidates.length === 1) {
        takenUsers.add(String(candidates[0]._id));
        resolved.push({ entry, key, user: candidates[0] as any });
      } else {
        resolved.push({
          entry,
          key,
          user: null,
          ambiguousWith:
            candidates.length > 1 ? candidates.map((u) => u.name) : undefined,
        });
      }
    }

    const existing = await this.attendanceModel
      .find({ game: game._id })
      .sort({ joinedAt: 1 })
      .lean();

    const existingByUser = new Map(
      existing.filter((a) => a.user).map((a) => [String(a.user), a]),
    );
    // Convidados são casados por nome, em ordem: dois "Eduardo" ocupam dois slots.
    const guestPool = new Map<string, typeof existing>();
    for (const a of existing.filter((x) => x.guest)) {
      const k = a.guest!.nameKey;
      guestPool.set(k, [...(guestPool.get(k) ?? []), a]);
    }

    const plan = {
      matched: [] as Array<{ name: string; userId: string; paid: boolean }>,
      guests: [] as Array<{ name: string; paid: boolean; isNew: boolean }>,
      ambiguous: [] as Array<{ name: string; candidates: string[] }>,
      removed: [] as Array<{ name: string; isGuest: boolean }>,
      /** Situações que a lista não resolve sozinha e pedem olho humano. */
      warnings: [] as string[],
    };

    const keptAttendanceIds = new Set<string>();
    const writes: Array<() => Promise<unknown>> = [];

    resolved.forEach((r, index) => {
      const paid = r.entry.paid ?? false;
      // A ordem da lista define quem fica de fora quando passa do máximo.
      const status =
        index < game.maxPlayers
          ? AttendanceStatus.CONFIRMED
          : AttendanceStatus.WAITLIST;

      if (r.user) {
        const userId = String(r.user._id);
        const current = existingByUser.get(userId);
        if (current) keptAttendanceIds.add(String(current._id));
        plan.matched.push({ name: r.user.name, userId, paid });

        writes.push(() =>
          this.attendanceModel.findOneAndUpdate(
            { game: game._id, user: new Types.ObjectId(userId) },
            {
              $set: { status, paid, noShow: false, ...(paid ? {} : { paidAt: null }) },
              $setOnInsert: { joinedAt: new Date() },
            },
            { upsert: true },
          ),
        );
        return;
      }

      if (r.ambiguousWith) {
        plan.ambiguous.push({ name: r.entry.name, candidates: r.ambiguousWith });
      }

      const pool = guestPool.get(r.key) ?? [];
      const current = pool.shift(); // consome um slot deste nome
      guestPool.set(r.key, pool);
      if (current) keptAttendanceIds.add(String(current._id));

      plan.guests.push({ name: r.entry.name, paid, isNew: !current });

      writes.push(() =>
        current
          ? this.attendanceModel.updateOne(
              { _id: current._id },
              { $set: { status, paid, ...(paid ? {} : { paidAt: null }) } },
            )
          : this.attendanceModel.create({
              game: game._id,
              guest: {
                name: r.entry.name.trim(),
                nameKey: r.key,
                phone: r.entry.phone?.replace(/\D/g, ''),
                lid: r.entry.lid,
                invitedBy: r.entry.invitedBy
                  ? new Types.ObjectId(r.entry.invitedBy)
                  : undefined,
                source: 'whatsapp',
              },
              status,
              paid,
              joinedAt: new Date(),
            }),
      );
    });

    // Quem sumiu da lista: jogador vira OUT (conta como desistência no histórico),
    // convidado é apagado — não tem histórico próprio para preservar.
    for (const a of existing) {
      if (keptAttendanceIds.has(String(a._id))) continue;
      const isGuest = !a.user;
      const name = isGuest
        ? (a.guest?.name ?? 'Sem nome')
        : ((users.find((u) => String(u._id) === String(a.user)) as any)?.name ??
          'Jogador');

      if (a.paid) {
        // Quem já pagou não sai sozinho: some da lista por erro de digitação e a
        // remoção automática apagaria o pagamento. Fica, e o admin decide.
        plan.warnings.push(
          `${name} saiu da lista mas consta como pago — mantido na pelada, confira.`,
        );
        continue;
      }

      plan.removed.push({ name, isGuest });
      writes.push(() =>
        isGuest
          ? this.attendanceModel.deleteOne({ _id: a._id })
          : this.attendanceModel.updateOne(
              { _id: a._id },
              { $set: { status: AttendanceStatus.OUT, paid: false, paidAt: null } },
            ),
      );
    }

    const summary = {
      dryRun: !!dto.dryRun,
      total: dto.entries.length,
      matchedCount: plan.matched.length,
      guestCount: plan.guests.length,
      newGuestCount: plan.guests.filter((g) => g.isNew).length,
      removedCount: plan.removed.length,
      ...plan,
    };

    if (dto.dryRun) return { ...summary, game: await this.toView(game.toObject(), adminId) };

    for (const write of writes) await write();
    // `rebalance` (e não `refreshStatus`) porque quem foi mantido apesar de ter saído
    // da lista pode estourar o máximo — aí o excedente vai para a espera por ordem de
    // chegada, em vez de a pelada ficar com "15/14 confirmados".
    await this.rebalance(game);

    return { ...summary, ...(await this.findOne(gameId, adminId)) };
  }

  /** Presenças de convidado cujo nome bate com o de um jogador cadastrado. */
  async guestCandidates(userId: string) {
    const user = await this.userModel.findById(userId).select('name').lean();
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const keys = [...new Set([nameKey(user.name), firstNameKey(user.name)])].filter(
      Boolean,
    );

    const rows = await this.attendanceModel
      .find({ 'guest.nameKey': { $in: keys } })
      .populate('game', 'title date')
      .sort({ joinedAt: -1 })
      .lean();

    return rows.map((r) => ({
      attendanceId: String(r._id),
      guestName: r.guest?.name,
      invitedBy: r.guest?.invitedBy ? String(r.guest.invitedBy) : null,
      game: {
        id: String((r.game as any)?._id),
        title: (r.game as any)?.title,
        date: (r.game as any)?.date,
      },
      status: r.status,
      paid: r.paid,
    }));
  }

  /**
   * Vincula presenças de convidado a uma conta — o histórico passa a contar para ela.
   * Decisão de um admin, nunca automática: nome igual não é prova de mesma pessoa.
   */
  async claimGuest(userId: string, attendanceIds: string[]) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const ids = attendanceIds.map((id) => new Types.ObjectId(id));
    const rows = await this.attendanceModel.find({ _id: { $in: ids } }).lean();

    let claimed = 0;
    const skipped: Array<{ attendanceId: string; reason: string }> = [];

    for (const row of rows) {
      if (row.user) {
        skipped.push({ attendanceId: String(row._id), reason: 'já tem dono' });
        continue;
      }
      // A pessoa não pode aparecer duas vezes na mesma pelada.
      const clash = await this.attendanceModel.exists({
        game: row.game,
        user: new Types.ObjectId(userId),
      });
      if (clash) {
        skipped.push({
          attendanceId: String(row._id),
          reason: 'já está nessa pelada com a própria conta',
        });
        continue;
      }

      await this.attendanceModel.updateOne(
        { _id: row._id },
        { $set: { user: new Types.ObjectId(userId) }, $unset: { guest: '' } },
      );
      claimed++;
    }

    return { claimed, skipped };
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

      // Convidado sobe da espera igual, mas não há para quem notificar.
      if (next.user) {
        await this.push.sendToUsers([String(next.user)], {
          title: '🎉 Abriu vaga pra você!',
          body: `Você saiu da lista de espera de ${game.title} — ${this.formatShort(game.date)}`,
          url: `/peladas/${game._id}`,
        });
      }
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
        // Convidados não têm conta, logo não têm push.
        players.filter((p) => p.user).map((p) => String(p.user)),
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

    // Convidados entram na lista como todo mundo: aparecem no convite, contam no
    // rateio e ocupam vaga. O que muda é que não têm conta por trás.
    return rows.map((r, index) => {
      const u = r.user as any;
      return {
        userId: u ? String(u._id) : null,
        name: u ? u.name : (r.guest?.name ?? 'Sem nome'),
        phone: u ? u.phone : r.guest?.phone,
        position: u ? u.position : undefined,
        level: u ? u.level : undefined,
        isGuest: !u,
        invitedBy: r.guest?.invitedBy ? String(r.guest.invitedBy) : null,
        attendanceId: String(r._id),
        status: r.status,
        paid: r.paid,
        paidAt: r.paidAt,
        noShow: r.noShow,
        joinedAt: r.joinedAt,
        order: index + 1,
      };
    });
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
