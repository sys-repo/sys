import { describe, expect, it } from '../-test.ts';
import { HttpServer } from './mod.ts';

describe('HTTP Client', () => {
  it('API', async () => {
    const m = await import('@sys/http/server');
    expect(m.HttpServer).to.equal(HttpServer);
  });
});
