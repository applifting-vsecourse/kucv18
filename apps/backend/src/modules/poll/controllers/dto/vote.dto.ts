import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VoteDto {
  @ApiProperty({ description: 'Option to vote for, must belong to the poll' })
  @IsString()
  @IsNotEmpty()
  optionId!: string;
}
