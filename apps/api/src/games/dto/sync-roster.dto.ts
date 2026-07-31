import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class RosterEntryDto {
  /** Nome como está na lista do WhatsApp, ex.: "Ana Beatriz". */
  @IsString()
  @MinLength(1)
  name: string;

  /** Na lista do grupo, o ✅ ao lado do nome significa "já pagou". */
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  /** Preenchido quando a pessoa foi mencionada (@) em vez de digitada. */
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  lid?: string;

  /** Quem trouxe este convidado. */
  @IsOptional()
  @IsMongoId()
  invitedBy?: string;
}

export class SyncRosterDto {
  /**
   * A lista COMPLETA, na ordem em que aparece na mensagem. Quem não estiver aqui
   * sai da pelada — a lista do grupo é reenviada atualizada, então ela manda.
   */
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => RosterEntryDto)
  entries: RosterEntryDto[];

  /**
   * Só simula e devolve o que aconteceria, sem gravar nada. O bot usa isso para
   * mostrar o resultado no grupo e pedir confirmação antes de valer.
   */
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
