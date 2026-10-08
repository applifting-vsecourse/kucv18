import { Mood, Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

// Lower-case and strip diacritics so "kocka" matches "Kočka".
const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

@Injectable()
export class QuacksService {
  constructor(private readonly quackRepository: QuackRepository) {}

  async getQuacks(search?: string): Promise<Quack[]> {
    const quacks = await this.quackRepository.getQuacks();
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
    quackData: { text: string; mood?: Mood },
  ): Promise<Quack> {
    return this.quackRepository.createQuack({
      text: quackData.text,
      mood: quackData.mood,
      // the author is taken from the session, never from the request body
      userId: user.id,
    });
  }
}
