import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Files } from '../mod.ts';
import type { FilesFs as TFilesFs } from '@sys/model/files/fs/t';
import { Fs } from '../m.Fs.ts';

describe('FilesFs', () => {
  it('API: public export', async () => {
    const m = await import('@sys/model/files/fs');

    expect(m.Files).to.equal(Files);
    expect(m.Files.Fs).to.equal(Fs);

    expect(Object.keys(Files).sort()).to.eql([
      'Authority',
      'Client',
      'Cmd',
      'ContentRef',
      'Cursor',
      'Fs',
      'Policy',
    ]);
    expect(Object.keys(Files.Fs).sort()).to.eql(['Readonly', 'Writable']);
    expect(Object.keys(Files.Fs.Readonly).sort()).to.eql(['create', 'live']);
    expect(Object.keys(Files.Fs.Writable).sort()).to.eql(['create', 'live']);

    expectTypeOf(m.Files).toEqualTypeOf<t.FilesFs.FilesLib>();
    expectTypeOf(m.Files.Fs).toEqualTypeOf<t.FilesFs.Lib>();
    expectTypeOf(m.Files.Fs).toEqualTypeOf<TFilesFs.Lib>();
  });
});
