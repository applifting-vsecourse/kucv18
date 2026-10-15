import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuackDto } from './create-quack.dto';

const errorsFor = async (body: unknown): Promise<number> =>
  (await validate(plainToInstance(CreateQuackDto, body))).length;

describe('CreateQuackDto poll validation', () => {
  it('accepts a quack without a poll', async () => {
    await expect(errorsFor({ text: 'hi' })).resolves.toBe(0);
  });

  it('accepts 2 to 6 options', async () => {
    const options = (n: number): string[] =>
      Array.from({ length: n }, (_, i) => `Option ${i}`);
    await expect(
      errorsFor({ text: 'q', poll: { options: options(2) } }),
    ).resolves.toBe(0);
    await expect(
      errorsFor({ text: 'q', poll: { options: options(6) } }),
    ).resolves.toBe(0);
    await expect(
      errorsFor({ text: 'q', poll: { options: options(1) } }),
    ).resolves.toBeGreaterThan(0);
    await expect(
      errorsFor({ text: 'q', poll: { options: options(7) } }),
    ).resolves.toBeGreaterThan(0);
  });

  it('rejects empty, blank and too long options', async () => {
    await expect(
      errorsFor({ text: 'q', poll: { options: ['a', ''] } }),
    ).resolves.toBeGreaterThan(0);
    await expect(
      errorsFor({ text: 'q', poll: { options: ['a', '   '] } }),
    ).resolves.toBeGreaterThan(0);
    await expect(
      errorsFor({ text: 'q', poll: { options: ['a', 'x'.repeat(81)] } }),
    ).resolves.toBeGreaterThan(0);
    await expect(
      errorsFor({ text: 'q', poll: { options: ['a', 'x'.repeat(80)] } }),
    ).resolves.toBe(0);
  });

  it('trims options', async () => {
    const dto = plainToInstance(CreateQuackDto, {
      text: 'q',
      poll: { options: ['  a ', 'b'] },
    });
    expect(dto.poll?.options).toEqual(['a', 'b']);
  });
});
