// Example unit test — the pattern to copy for your own services.
// The repository is mocked, so the test exercises the service in isolation.
import { Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { QuacksService } from './quacks.service';

const user = { id: 'u1' } as Identity;

const aQuack = (overrides: Partial<Quack> = {}): Quack => ({
  id: 'q1',
  text: 'quack quack',
  mood: null,
  userId: 'u1',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  user: { id: 'u1', name: 'Caffeinated Duck', username: 'CaffeinatedDuck' },
  ...overrides,
});

describe('QuacksService', () => {
  it('returns quacks from the repository', async () => {
    const quacks = [aQuack()];
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue(quacks);

    const service = new QuacksService(repository);

    await expect(service.getQuacks(user)).resolves.toEqual(quacks);
    expect(repository.getQuacks).toHaveBeenCalledWith('u1');
  });

  it('filters by text or author name, ignoring case and accents', async () => {
    const cat = aQuack({ id: 'a', text: 'Kočka na střeše' });
    const byAuthor = aQuack({
      id: 'b',
      text: 'nothing here',
      user: { id: 'u2', name: 'Příliš Kocour', username: 'kocour' },
    });
    const other = aQuack({ id: 'c', text: 'quack' });
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue([cat, byAuthor, other]);

    const service = new QuacksService(repository);

    await expect(service.getQuacks(user, 'KOCKA')).resolves.toEqual([cat]);
    await expect(service.getQuacks(user, 'prilis')).resolves.toEqual([
      byAuthor,
    ]);
    await expect(service.getQuacks(user, 'zzz')).resolves.toEqual([]);
    await expect(service.getQuacks(user, '  ')).resolves.toHaveLength(3);
  });

  it('creates a quack owned by the signed-in user', async () => {
    const created = aQuack({ id: 'q2', text: 'hello' });
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(created);

    const service = new QuacksService(repository);
    await expect(service.createQuack(user, { text: 'hello' })).resolves.toEqual(
      created,
    );
    // the author comes from the session, not from the caller's payload
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'hello',
      mood: undefined,
      userId: 'u1',
      pollOptions: undefined,
    });
  });

  it('passes the chosen mood through to the repository', async () => {
    const created = aQuack({ id: 'q3', text: 'grr', mood: 'angry' });
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(created);

    const service = new QuacksService(repository);
    await expect(
      service.createQuack(user, { text: 'grr', mood: 'angry' }),
    ).resolves.toEqual(created);
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'grr',
      mood: 'angry',
      userId: 'u1',
      pollOptions: undefined,
    });
  });

  it('creates a poll quack with the options in order', async () => {
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(aQuack());

    const service = new QuacksService(repository);

    await service.createQuack(user, {
      text: 'Lunch?',
      pollOptions: ['Pizza', 'Ramen'],
    });
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'Lunch?',
      mood: undefined,
      userId: 'u1',
      pollOptions: ['Pizza', 'Ramen'],
    });
  });

  it('rejects poll options that differ only by case or accents', async () => {
    const repository = mock<QuackRepository>();
    const service = new QuacksService(repository);

    await expect(
      service.createQuack(user, {
        text: 'Lunch?',
        pollOptions: ['Káva', 'kava'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createQuack).not.toHaveBeenCalled();
  });

  describe('deleteQuack', () => {
    it('deletes the quack of the signed-in user', async () => {
      const repository = mock<QuackRepository>();
      repository.findQuackById.mockResolvedValue(aQuack());

      await new QuacksService(repository).deleteQuack(user, 'q1');

      expect(repository.deleteQuack).toHaveBeenCalledWith('q1');
    });

    it("refuses to delete someone else's quack", async () => {
      const repository = mock<QuackRepository>();
      repository.findQuackById.mockResolvedValue(aQuack({ userId: 'u2' }));

      await expect(
        new QuacksService(repository).deleteQuack(user, 'q1'),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.deleteQuack).not.toHaveBeenCalled();
    });

    it('reports a missing quack', async () => {
      const repository = mock<QuackRepository>();
      repository.findQuackById.mockResolvedValue(null);

      await expect(
        new QuacksService(repository).deleteQuack(user, 'nope'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
