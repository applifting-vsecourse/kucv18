import { Mood, MOODS } from '@/modules/quack/domain/quack';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// No `poll` here: the controller's ValidationPipe uses forbidNonWhitelisted,
// so a poll on a reply is a 400.
export class CreateReplyDto {
  @ApiProperty({
    description: 'Body of the reply',
    example: 'Quack back!',
    maxLength: 280,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  text!: string;

  @ApiPropertyOptional({
    description: 'How the reply feels. Leave out for no mood.',
    enum: MOODS,
    example: 'happy',
  })
  @IsOptional()
  @IsIn(MOODS)
  mood?: Mood;
}
