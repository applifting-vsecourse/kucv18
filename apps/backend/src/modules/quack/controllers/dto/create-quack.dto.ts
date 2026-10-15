import { CreatePollDto } from '@/modules/poll/controllers/dto/create-poll.dto';
import { Mood, MOODS } from '@/modules/quack/domain/quack';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuackDto {
  @ApiProperty({
    description: 'Body of the quack',
    example: 'Hello, world!',
    maxLength: 280,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  text!: string;

  @ApiPropertyOptional({
    description: 'How the quack feels. Leave out for no mood.',
    enum: MOODS,
    example: 'happy',
  })
  @IsOptional()
  @IsIn(MOODS)
  mood?: Mood;

  @ApiPropertyOptional({
    description:
      'Turns the quack into a poll. The quack text is the question; the options are the answers.',
    type: CreatePollDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;
}
