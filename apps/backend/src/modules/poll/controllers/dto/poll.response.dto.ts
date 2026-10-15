import { Poll } from '@/modules/poll/domain/poll';
import { ApiProperty } from '@nestjs/swagger';

class PollOptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty({ description: 'Number of votes for this option' })
  votes!: number;
}

export class PollResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: [PollOptionResponseDto] })
  options!: PollOptionResponseDto[];

  @ApiProperty()
  totalVotes!: number;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Option the signed-in user voted for, null if none',
  })
  myVoteOptionId!: string | null;

  static fromDomain(poll: Poll): PollResponseDto {
    return {
      id: poll.id,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        votes: option.votes,
      })),
      totalVotes: poll.totalVotes,
      myVoteOptionId: poll.myVoteOptionId,
    };
  }
}
