import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AttendanceStatus {
  CONFIRMED = 'CONFIRMED',
  WAITLIST = 'WAITLIST',
  /** Confirmou e depois desistiu — guardamos para o histórico de faltas. */
  OUT = 'OUT',
}

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true, collection: 'attendances' })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Game', required: true, index: true })
  game: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

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
AttendanceSchema.index({ game: 1, user: 1 }, { unique: true });
