import { PollResponseDto } from '@/modules/poll/controllers/dto/poll.response.dto';
import { Mood, MOODS, Quack } from '@/modules/quack/domain/quack';
import { ApiProperty } from '@nestjs/swagger';

class QuackUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;
}

export class QuackResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  text!: string | null;

  @ApiProperty({ enum: MOODS, nullable: true })
  mood!: Mood | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'null on a deleted quack',
  })
  userId!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The quack this one replies to, null for a top-level quack',
  })
  parentId!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  createdAt!: Date | null;

  @ApiProperty({ type: QuackUserDto, nullable: true })
  user!: QuackUserDto | null;

  @ApiProperty({ type: PollResponseDto, nullable: true })
  poll!: PollResponseDto | null;

  @ApiProperty({ description: 'Number of replies, counted on read' })
  replyCount!: number;

  @ApiProperty({
    description:
      'true for a deleted quack that is kept only because it has replies. It carries no content, author or date.',
  })
  isDeleted!: boolean;

  @ApiProperty({
    type: () => [QuackResponseDto],
    required: false,
    description: 'Only on GET /quacks/:id, oldest first',
  })
  replies?: QuackResponseDto[];

  static fromDomain(quack: Quack): QuackResponseDto {
    const replies = quack.replies?.map(QuackResponseDto.fromDomain);

    // A tombstone exposes nothing but its place in the thread.
    if (quack.deletedAt) {
      return {
        id: quack.id,
        text: null,
        mood: null,
        userId: null,
        parentId: quack.parentId,
        createdAt: null,
        user: null,
        poll: null,
        replyCount: quack.replyCount,
        isDeleted: true,
        replies,
      };
    }

    if (!quack.user) {
      throw new Error(
        `QuackResponseDto.fromDomain expected quack.user to be loaded for quack ${quack.id}`,
      );
    }
    return {
      id: quack.id,
      text: quack.text,
      mood: quack.mood,
      userId: quack.userId,
      parentId: quack.parentId,
      createdAt: quack.createdAt,
      user: {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.username,
      },
      poll: quack.poll ? PollResponseDto.fromDomain(quack.poll) : null,
      replyCount: quack.replyCount,
      isDeleted: false,
      replies,
    };
  }
}
