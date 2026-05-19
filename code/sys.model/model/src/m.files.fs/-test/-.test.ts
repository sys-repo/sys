import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesFs } from '../mod.ts';
import type { FilesFs as TFilesFs } from '@sys/model/files/fs/t';

describe('FilesFs', () => {
  it('API: public export', async () => {
    const m = await import('@sys/model/files/fs');

    expect(m.FilesFs).to.equal(FilesFs);
    expectTypeOf(m.FilesFs).toEqualTypeOf<t.FilesFs.Lib>();
    expectTypeOf(m.FilesFs).toEqualTypeOf<TFilesFs.Lib>();
  });

  it('API: public type path exposes the same FilesFs surface', () => {
    const local = {} as t.FilesFs.Readonly;
    const exported = {} as TFilesFs.Readonly;

    expectTypeOf(local).toEqualTypeOf<TFilesFs.Readonly>();
    expectTypeOf(exported).toEqualTypeOf<t.FilesFs.Readonly>();
  });
});
