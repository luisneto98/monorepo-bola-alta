import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AttendanceStatus {
  CONFIRMED = 'CONFIRMED',
  WAITLIST = 'WAITLIST',
  /** Confirmou e depois desistiu — guardamos para o histórico de faltas. */
  OUT = 'OUT',
}

/**
 * Quem está na lista mas não tem conta.
 *
 * As listas do grupo trazem só o primeiro nome ("3. Ronny ✅"), então quase sempre é
 * tudo que sabemos. Quando a pessoa se cadastra, um admin vincula essas presenças à
 * conta nova e o histórico passa a contar.
 */
@Schema({ _id: false })
export class AttendanceGuest {
  /** Nome como apareceu na lista. */
  @Prop({ required: true, trim: true })
  name: string;

  /** `name` normalizado — usado para casar com cadastros. NÃO é único. */
  @Prop({ required: true, trim: true, index: true })
  nameKey: string;

  /** Só existe quando a pessoa foi mencionada no WhatsApp, não digitada. */
  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  lid?: string;

  /**
   * Quem trouxe o convidado. Responde pelo pagamento dele e desambigua homônimos
   * ("Eduardo do Luís" ≠ "Eduardo da Carol").
   */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  @Prop({ type: String, default: 'whatsapp' })
  source: string;
}

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true, collection: 'attendances' })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Game', required: true, index: true })
  game: Types.ObjectId;

  /**
   * Jogador cadastrado. Ausente quando a presença é de convidado — nesse caso
   * `guest` está preenchido. Sempre exatamente um dos dois.
   */
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user?: Types.ObjectId;

  @Prop({ type: AttendanceGuest })
  guest?: AttendanceGuest;

  @Prop({ type: String, enum: AttendanceStatus, default: AttendanceStatus.CONFIRMED })
  status: AttendanceStatus;

  /** Ordem de chegada — define quem sai da lista de espera primeiro. */
  @Prop({ type: Date, default: () => new Date() })
  joinedAt: Date;

  @Prop({ type: Boolean, default: false })
  paid: boolean;

  @Prop({ type: Date })
  paidAt?: Date;

  /** Admin que deu a baixa do pagamento. */
  @Prop({ type: String })
  paidBy?: string;

  /** Marcado pelo admin depois da pelada: confirmou e não apareceu. */
  @Prop({ type: Boolean, default: false })
  noShow: boolean;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

/**
 * Um jogador cadastrado entra uma vez só por pelada.
 *
 * O filtro parcial é necessário porque presenças de convidado não têm `user`: sem
 * ele, o índice único trataria todos os convidados como o mesmo `null` e só
 * permitiria um convidado por pelada.
 *
 * ⚠️ Este índice MUDOU (antes era `{ game, user }` unique simples). Bases que já
 * existem precisam dropar o antigo — ver `apps/api/scripts/migrate-guest-index.js`.
 */
AttendanceSchema.index(
  { game: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } },
);

// Convidados NÃO têm índice único: a mesma pelada pode ter dois "Eduardo".
AttendanceSchema.index({ 'guest.nameKey': 1 });
