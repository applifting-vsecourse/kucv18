import { PollResponseDto } from '@/modules/poll/controllers/dto/poll.response.dto';
import { VoteDto } from '@/modules/poll/controllers/dto/vote.dto';
import { PollsService } from '@/modules/poll/services/polls.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Param,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('polls')
@Controller('polls')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Put(':pollId/vote')
  @ApiOperation({
    summary: 'Vote in a poll, or move your vote to another option',
  })
  @ApiResponse({ status: 200, type: PollResponseDto })
  @ApiResponse({ status: 400, description: 'Option is not part of this poll' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async vote(
    @User() user: Identity,
    @Param('pollId') pollId: string,
    @Body() body: VoteDto,
  ): Promise<PollResponseDto> {
    const poll = await this.pollsService.vote(user, pollId, body.optionId);
    return PollResponseDto.fromDomain(poll);
  }
}
