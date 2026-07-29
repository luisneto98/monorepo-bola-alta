import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum GameStatus {
  /** Ainda não bateu o mínimo de jogadores. */
  PENDING = 'PENDING',
  /** Bateu o mínimo — a pelada está valendo. */
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
  /** Já aconteceu (fechada para acerto de contas). */
  FINISHED = 'FINISHED',
}

export type GameDocument = HydratedDocument<Game>;

@Schema({ _id: false })
export class GameLocation {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  mapsUrl?: string;
}

@Schema({ timestamps: true, collection: 'games' })
export class Game {
  @Prop({ required: true, trim: true })
  title: string;

  /** Data e hora de início, em UTC. */
  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop({ type: Number, default: 120 })
  durationMinutes: number;

  @Prop({ type: GameLocation, required: true })
  location: GameLocation;

  /** Mínimo para a pelada ser confirmada (padrão: 2 times de 6). */
  @Prop({ type: Number, default: 12, min: 2 })
  minPlayers: number;

  /** Acima disso, quem confirmar entra na lista de espera. */
  @Prop({ type: Number, default: 18, min: 2 })
  maxPlayers: number;

  /** Custo total da quadra, em reais. O rateio é custo ÷ confirmados. */
  @Prop({ type: Number, default: 0, min: 0 })
  cost: number;

  @Prop({ type: String, enum: GameStatus, default: GameStatus.PENDING, index: true })
  status: GameStatus;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: Date })
  canceledAt?: Date;

  @Prop({ trim: true })
  cancelReason?: string;
}

export const GameSchema = SchemaFactory.createForClass(Game);
