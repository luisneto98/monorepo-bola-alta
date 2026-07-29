import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** Posição preferida na quadra — usada no sorteio de times e no perfil. */
export enum PlayerPosition {
  LEVANTADOR = 'LEVANTADOR',
  PONTEIRO = 'PONTEIRO',
  OPOSTO = 'OPOSTO',
  CENTRAL = 'CENTRAL',
  LIBERO = 'LIBERO',
  INDEFINIDA = 'INDEFINIDA',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  /** Telefone com DDD, só dígitos. Usado para o convite no WhatsApp. */
  @Prop({ trim: true })
  phone?: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.PLAYER })
  role: UserRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Prop({
    type: String,
    enum: PlayerPosition,
    default: PlayerPosition.INDEFINIDA,
  })
  position: PlayerPosition;

  /** 1 a 5, autodeclarado. */
  @Prop({ type: Number, min: 1, max: 5, default: 3 })
  level: number;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: String })
  approvedBy?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
