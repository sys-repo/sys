import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesFs } from '../mod.ts';
import type { FilesFs as TFilesFs } from '@sys/model/files/fs/t';

describe('FilesFs', () => {
  it('API: public export', async () => {
    const m = await import('@sys/model/files/fs');

    expect(m.FilesFs).to.equal(FilesFs);
    expect(Object.keys(FilesFs).sort()).to.eql(['Readonly']);
    expect(Object.keys(FilesFs.Readonly).sort()).to.eql(['create', 'live']);
    expectTypeOf(m.FilesFs).toEqualTypeOf<t.FilesFs.Lib>();
    expectTypeOf(m.FilesFs).toEqualTypeOf<TFilesFs.Lib>();
  });
});
