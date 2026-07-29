import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class LocationDto {
  @IsString()
  @MinLength(2, { message: 'Informe o nome da quadra.' })
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  mapsUrl?: string;
}

export class CreateGameDto {
  @IsString()
  @MinLength(3, { message: 'Dê um nome para a pelada.' })
  title: string;

  /** ISO 8601, ex.: 2026-08-05T23:00:00.000Z */
  @IsDateString({}, { message: 'Data inválida.' })
  date: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  durationMinutes?: number;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsInt()
  @Min(2)
  minPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxPlayers?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
