import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListQuacksQuery } from './list-quacks.query';

const parse = (q?: string) => plainToInstance(ListQuacksQuery, { q });

describe('ListQuacksQuery', () => {
  it('accepts a missing term', async () => {
    await expect(validate(parse())).resolves.toHaveLength(0);
  });

  it('trims the term', () => {
    expect(parse('  duck ').q).toBe('duck');
  });

  it('accepts 100 characters and rejects 101', async () => {
    await expect(validate(parse('a'.repeat(100)))).resolves.toHaveLength(0);
    await expect(validate(parse('a'.repeat(101)))).resolves.toHaveLength(1);
  });
});
