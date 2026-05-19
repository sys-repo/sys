import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesMemory } from '../mod.ts';
import type { FilesMemory as TFilesMemory } from '@sys/model/files/memory/t';

describe('FilesMemory', () => {
  it('API: public export', async () => {
    const m = await import('@sys/model/files/memory');

    expect(m.FilesMemory).to.equal(FilesMemory);
    expectTypeOf(m.FilesMemory).toEqualTypeOf<t.FilesMemory.Lib>();
    expectTypeOf(m.FilesMemory).toEqualTypeOf<TFilesMemory.Lib>();
  });

  it('API: public type path exposes the same FilesMemory surface', () => {
    const local = {} as t.FilesMemory.Readonly;
    const exported = {} as TFilesMemory.Readonly;

    expectTypeOf(local).toEqualTypeOf<TFilesMemory.Readonly>();
    expectTypeOf(exported).toEqualTypeOf<t.FilesMemory.Readonly>();
  });
});
