import { Mood, MOODS } from '@/modules/quack/domain/quack';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const NAME_MAX = 50;
export const BIO_MAX = 160;

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description:
      'Unique, case-insensitive. Letters, numbers, dots, underscores',
    example: 'deep_duck.thoughts',
    minLength: USERNAME_MIN,
    maxLength: USERNAME_MAX,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(new RegExp(`^[A-Za-z0-9._]{${USERNAME_MIN},${USERNAME_MAX}}$`), {
    message: `username must be ${USERNAME_MIN}–${USERNAME_MAX} characters: letters, numbers, dots and underscores`,
  })
  username?: string;

  @ApiPropertyOptional({ description: 'Display name', maxLength: NAME_MAX })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX)
  name?: string;

  @ApiPropertyOptional({
    description: 'Short bio. Empty string or null clears it.',
    maxLength: BIO_MAX,
    nullable: true,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(BIO_MAX)
  bio?: string | null;

  @ApiPropertyOptional({
    description: 'Mood preselected for new quacks. Null means none.',
    enum: MOODS,
    nullable: true,
  })
  @IsOptional()
  @IsIn(MOODS)
  defaultMood?: Mood | null;
}
