import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Files } from '../mod.ts';
import type { Files as TFiles } from '@sys/model/files/t';

describe('Files', () => {
  it('API: public export', async () => {
    const m = await import('@sys/model/files');

    expect(m.Files).to.equal(Files);
    expect(Object.keys(Files).sort()).to.eql([
      'Authority',
      'Capability',
      'Client',
      'Cmd',
      'ContentRef',
      'Cursor',
      'Policy',
    ]);
    expect(Files.Capability.names).to.eql([
      'list',
      'stat',
      'read',
      'write',
      'remove',
      'watch',
      'manifest',
    ]);
    expectTypeOf(m.Files).toEqualTypeOf<t.Files.Lib>();
    expectTypeOf(m.Files).toEqualTypeOf<TFiles.Lib>();
  });
});
