import { Mood, Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
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
    const quacks = await this.quackRepository.getQuacks(user.id, onlyMine);
    const needle = normalize((search ?? '').trim());
    if (!needle) return quacks;
    // Done here rather than in SQL: Postgres has no accent-insensitive
    // matching without the unaccent extension.
    return quacks.filter(
      (quack) =>
        normalize(quack.text).includes(needle) ||
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

  async deleteQuack(user: Identity, quackId: string): Promise<void> {
    const quack = await this.quackRepository.findQuackById(quackId);
    if (!quack) throw new NotFoundException('Quack not found');
    // The ownership check lives here, not in the UI: hiding the button is
    // only a convenience.
    if (quack.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own quacks');
    }
    await this.quackRepository.deleteQuack(quackId);
  }
}
