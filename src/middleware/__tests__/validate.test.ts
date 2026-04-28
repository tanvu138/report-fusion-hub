import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../validation/validate';

describe('validate middleware', () => {
  it('passes when body is valid', async () => {
    const schema = z.object({ name: z.string() });
    const middleware = validate(schema);
    const req: any = { body: { name: 'alice' } };
    const res: any = {};
    const next = vi.fn();

    await middleware(req, res, next);

    expect(req.body).toEqual({ name: 'alice' });
    expect(next).toHaveBeenCalledWith();
  });

  it('forwards error when validation fails', async () => {
    const schema = z.object({ name: z.string() });
    const middleware = validate(schema);
    const req: any = { body: { name: 123 } };
    const res: any = {};
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
