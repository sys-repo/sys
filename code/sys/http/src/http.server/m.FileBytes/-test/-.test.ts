import { serveFileBytes as Broad } from '@sys/http/server';
import type { HttpServer } from '@sys/http/t';
import { describe, expect, expectTypeOf, it } from '../../../-test.ts';

describe('@sys/http/server/file-bytes public entrypoint', () => {
  it('resolves one exact constrained public response primitive', async () => {
    const m = await import('@sys/http/server/file-bytes');

    expect(Object.getOwnPropertyNames(m)).to.eql(['serveFileBytes']);
    expect(m.serveFileBytes).to.equal(Broad);
    expectTypeOf(m.serveFileBytes).toEqualTypeOf<HttpServer.ServeFileBytes.Method>();
  });
});
