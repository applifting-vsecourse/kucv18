import { UserRole } from '@/generated/prisma/client';
import { Mood, Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// Lower-case and strip diacritics so "kocka" matches "Kočka".
const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

@Injectable()
export class QuacksService {
  constructor(private readonly quackRepository: QuackRepository) {}

  async getQuacks(
    user: Identity,
    search?: string,
    onlyMine = false,
  ): Promise<Quack[]> {
    // "mine" is resolved from the session, never from a user id in the request
    const needle = normalize((search ?? '').trim());
    if (!needle) return this.quackRepository.getQuacks(user.id, onlyMine);
    // Searching also looks into replies (never into tombstones). Done here
    // rather than in SQL: Postgres has no accent-insensitive matching
    // without the unaccent extension.
    const quacks = await this.quackRepository.getSearchableQuacks(
      user.id,
      onlyMine,
    );
    return quacks.filter(
      (quack) =>
        normalize(quack.text ?? '').includes(needle) ||
        normalize(quack.user?.name ?? '').includes(needle),
    );
  }

  async createQuack(
    user: Identity,
    quackData: { text: string; mood?: Mood; pollOptions?: string[] },
  ): Promise<Quack> {
    const options = quackData.pollOptions;
    if (options && new Set(options.map(normalize)).size !== options.length) {
      throw new BadRequestException('Poll options must be different');
    }
    return this.quackRepository.createQuack({
      text: quackData.text,
      mood: quackData.mood,
      pollOptions: options,
      // the author is taken from the session, never from the request body
      userId: user.id,
    });
  }

  async getThread(user: Identity, quackId: string): Promise<Quack> {
    const quack = await this.quackRepository.getThread(user.id, quackId);
    if (!quack) throw new NotFoundException('Quack not found');
    return quack;
  }

  async createReply(
    user: Identity,
    parentId: string,
    replyData: { text: string; mood?: Mood },
  ): Promise<Quack> {
    const parent = await this.quackRepository.findQuackById(parentId);
    if (!parent) throw new NotFoundException('Quack not found');
    // Threads are one level deep (docs/adr/0001, story-replies.md).
    if (parent.parentId) {
      throw new BadRequestException("You can't reply to a reply");
    }
    // A deleted quack only stays so its replies stay readable.
    if (parent.deletedAt) {
      throw new ConflictException('This quack was deleted');
    }
    return this.quackRepository.createQuack({
      text: replyData.text,
      mood: replyData.mood,
      parentId,
      userId: user.id,
    });
  }

  async deleteQuack(user: Identity, quackId: string): Promise<void> {
    const quack = await this.quackRepository.findQuackById(quackId);
    // A tombstone counts as already deleted.
    if (!quack || quack.deletedAt)
      throw new NotFoundException('Quack not found');
    // The permission check lives here, not in the UI: hiding the button is
    // only a convenience. The author or an admin may delete.
    const isOwner = quack.userId === user.id;
    const isAdmin = user.role === UserRole.admin;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only the author or an admin can delete this quack',
      );
    }
    await this.quackRepository.deleteQuack(quackId);
  }
}
