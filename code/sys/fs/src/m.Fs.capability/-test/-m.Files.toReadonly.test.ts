import type { t as TModel } from '@sys/model';
import { Files } from '@sys/model/files/fs';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Fs } from '../../mod.ts';
import { context, expectFilesFsError, POLICY, setupFixture } from './u.fixture.ts';

describe('Fs.Capability.Files.Readonly.create', () => {
  it('adapts @sys/fs to the files/fs readonly capability', async () => {
    const fixture = await setupFixture();
    try {
      const cap = Fs.Capability.Files.Readonly.create(Fs);
      expectTypeOf(cap).toMatchTypeOf<TModel.FilesFs.Capability.Readonly>();

      const backing = Files.Fs.Readonly.create({ fs: cap, root: fixture.root, policy: POLICY });
      const read = await backing.handlers['files:read'](
        { path: 'docs/readme.md' },
        context('files:read'),
      );
      expect(read).to.eql({
        kind: 'inline',
        file: { path: 'docs/readme.md', kind: 'file', size: 6 },
        encoding: 'utf8',
        content: 'hello\n',
      });

      const list = await backing.handlers['files:list']({ path: 'docs' }, context('files:list'));
      expect(list.entries).to.eql([{ path: 'docs/readme.md', kind: 'file', size: 6 }]);
    } finally {
      await Fs.remove(fixture.workspace);
    }
  });

  it('normalizes unreadable host stat/walk failures to Files-scoped absence', async () => {
    const fixture = await setupFixture();
    try {
      const fs = {
        ...Fs,
        stat: async (path: Parameters<typeof Fs.stat>[0]) => {
          if (String(path).endsWith('readme.md')) {
            throw new Error(`host stat leak: ${fixture.root}`);
          }
          return Fs.stat(path);
        },
        walk: async function* () {
          throw new Error(`host walk leak: ${fixture.root}`);
        },
      } satisfies typeof Fs;
      const cap = Fs.Capability.Files.Readonly.create(fs);
      const backing = Files.Fs.Readonly.create({ fs: cap, root: fixture.root, policy: POLICY });

      await expectFilesFsError(
        () => backing.handlers['files:stat']({ path: 'docs/readme.md' }, context('files:stat')),
        'FilesFsError.NotFound',
        fixture,
      );
      const list = await backing.handlers['files:list']({ path: 'docs' }, context('files:list'));
      expect(list.entries).to.eql([]);
    } finally {
      await Fs.remove(fixture.workspace);
    }
  });

  it('does not widen Files authority through real file symlink escapes', async () => {
    const fixture = await setupFixture();
    try {
      await Deno.symlink(fixture.outsideSecret, fixture.fileLink, { type: 'file' });

      const cap = Fs.Capability.Files.Readonly.create(Fs);
      const backing = Files.Fs.Readonly.create({ fs: cap, root: fixture.root, policy: POLICY });

      await expectFilesFsError(
        () => backing.handlers['files:stat']({ path: 'docs/leak.txt' }, context('files:stat')),
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
      await expectFilesFsError(
        () => backing.handlers['files:read']({ path: 'docs/leak.txt' }, context('files:read')),
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
      await expectFilesFsError(
        () => backing.handlers['files:list']({ path: 'docs' }, context('files:list')),
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
    } finally {
      await Fs.remove(fixture.workspace);
    }
  });

  it('rejects real directory symlink escapes for list and manifest', async () => {
    const fixture = await setupFixture();
    try {
      await Deno.symlink(fixture.outsideDir, fixture.dirLink, { type: 'dir' });

      const cap = Fs.Capability.Files.Readonly.create(Fs);
      const backing = Files.Fs.Readonly.create({ fs: cap, root: fixture.root, policy: POLICY });

      await expectFilesFsError(
        () => backing.handlers['files:list']({ path: 'docs/leak-dir' }, context('files:list')),
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
      await expectFilesFsError(
        () => backing.handlers['files:list']({ path: 'docs' }, context('files:list')),
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
      await expectFilesFsError(
        () => {
          return backing.handlers['files:manifest'](
            { path: 'docs/leak-dir' },
            context('files:manifest'),
          );
        },
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
      await expectFilesFsError(
        () => backing.handlers['files:manifest']({ path: 'docs' }, context('files:manifest')),
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
    } finally {
      await Fs.remove(fixture.workspace);
    }
  });
});
