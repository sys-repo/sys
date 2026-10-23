import { describe, expect, it, type t } from '../../-test.ts';
import { FilesMemory } from '../mod.ts';
import { allowAllMutablePolicy, cmd, expectFilesMemoryError } from './u.fixture.ts';

describe('FilesMemory.Writable.create: write/remove', () => {
  describe('surface', () => {
    it('advertises writable write/remove capabilities without live watch', async () => {
      const backing = FilesMemory.Writable.create({ policy: allowAllMutablePolicy });

      expect(await cmd.capabilities(backing)).to.eql({
        list: true,
        stat: true,
        read: true,
        write: true,
        remove: true,
        watch: false,
        manifest: true,
        fidelity: 'dynamic',
        encodings: ['utf8'],
      });
    });
  });

  describe('write truth', () => {
    it('writes complete text-file values and keeps list/stat/read as truth', async () => {
      const backing = FilesMemory.Writable.create({
        dirs: ['docs'],
        policy: allowAllMutablePolicy,
      });

      const created = await cmd.write(backing, {
        kind: 'text',
        path: 'docs/readme.md',
        content: '# Hello\n',
        encoding: 'utf8',
        mediaType: 'text/markdown',
      });
      expect(created).to.eql({
        kind: 'created',
        path: 'docs/readme.md',
        entry: { path: 'docs/readme.md', kind: 'file', size: 8, mediaType: 'text/markdown' },
      });
      expect(await cmd.stat(backing, { path: 'docs/readme.md' })).to.eql({
        entry: { path: 'docs/readme.md', kind: 'file', size: 8, mediaType: 'text/markdown' },
      });
      expect(await cmd.read(backing, { path: 'docs/readme.md' })).to.eql({
        kind: 'inline',
        file: { path: 'docs/readme.md', kind: 'file', size: 8, mediaType: 'text/markdown' },
        encoding: 'utf8',
        content: '# Hello\n',
      });

      const modified = await cmd.write(backing, {
        kind: 'text',
        path: 'docs/readme.md',
        content: '# Hello again\n',
        mediaType: 'text/markdown',
      });
      expect(modified).to.eql({
        kind: 'modified',
        path: 'docs/readme.md',
        entry: { path: 'docs/readme.md', kind: 'file', size: 14, mediaType: 'text/markdown' },
      });
      expect(await cmd.list(backing, { path: 'docs' })).to.eql({
        entries: [{ path: 'docs/readme.md', kind: 'file', size: 14, mediaType: 'text/markdown' }],
      });
    });

    it('writes complete byte-file values without routing bytes through JSON', async () => {
      const backing = FilesMemory.Writable.create({
        dirs: ['images'],
        policy: allowAllMutablePolicy,
      });
      const content = new Uint8Array([0, 1, 2, 255]);

      const result = await cmd.write(backing, {
        kind: 'bytes',
        path: 'images/logo.png',
        content,
        mediaType: 'image/png',
      });

      expect(result).to.eql({
        kind: 'created',
        path: 'images/logo.png',
        entry: { path: 'images/logo.png', kind: 'file', size: 4, mediaType: 'image/png' },
      });
      expect(await cmd.stat(backing, { path: 'images/logo.png' })).to.eql({
        entry: { path: 'images/logo.png', kind: 'file', size: 4, mediaType: 'image/png' },
      });
      await expectFilesMemoryError(
        () => cmd.read(backing, { path: 'images/logo.png', maxBytes: -1 as t.NumberBytes }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => cmd.read(backing, { path: 'images/logo.png' }),
        'FilesMemoryError.Unsupported',
      );
    });
  });

  describe('remove truth', () => {
    it('removes files and recursive directories through bounded remove authority', async () => {
      const backing = FilesMemory.Writable.create({
        dirs: ['docs/tmp'],
        policy: allowAllMutablePolicy,
      });
      await cmd.write(backing, { kind: 'text', path: 'docs/tmp/a.txt', content: 'a' });
      await cmd.write(backing, { kind: 'text', path: 'docs/tmp/nested/b.txt', content: 'b' });

      await expectFilesMemoryError(
        () => cmd.remove(backing, { path: 'docs/tmp' }),
        'FilesMemoryError.DirectoryNotEmpty',
      );

      const removed = await cmd.remove(backing, { path: 'docs/tmp', recursive: true });
      expect(removed).to.eql({ kind: 'deleted', path: 'docs/tmp' });
      await expectFilesMemoryError(
        () => cmd.stat(backing, { path: 'docs/tmp/a.txt' }),
        'FilesMemoryError.NotFound',
      );
      await expectFilesMemoryError(
        () => cmd.stat(backing, { path: 'docs/tmp/nested/b.txt' }),
        'FilesMemoryError.NotFound',
      );
    });
  });

  describe('authority', () => {
    it('enforces write/remove policy before mutating memory state', async () => {
      const backing = FilesMemory.Writable.create({
        files: { 'docs/keep.md': 'safe\n' },
        policy: {
          list: '**',
          stat: '**',
          read: '**',
          write: 'docs/public/**',
          remove: 'docs/trash/**',
          watch: '**',
          manifest: true,
          deny: 'docs/private/**',
        },
      });

      await expectFilesMemoryError(
        () => cmd.write(backing, { kind: 'text', path: 'other/readme.md', content: 'nope\n' }),
        'FilesMemoryError.PolicyDenied',
      );
      await expectFilesMemoryError(
        () =>
          cmd.write(backing, {
            kind: 'text',
            path: 'docs/private/readme.md',
            content: 'nope\n',
          }),
        'FilesMemoryError.PolicyDenied',
      );
      await expectFilesMemoryError(
        () => cmd.remove(backing, { path: 'docs/keep.md' }),
        'FilesMemoryError.PolicyDenied',
      );
      await expectFilesMemoryError(
        () => cmd.stat(backing, { path: 'other/readme.md' }),
        'FilesMemoryError.NotFound',
      );
      expect(await cmd.read(backing, { path: 'docs/keep.md' })).to.eql({
        kind: 'inline',
        file: { path: 'docs/keep.md', kind: 'file', size: 5 },
        encoding: 'utf8',
        content: 'safe\n',
      });
    });

    it('keeps recursive remove atomic when descendant policy denies deletion', async () => {
      const backing = FilesMemory.Writable.create({
        files: {
          'docs/tmp/public/a.txt': 'a',
          'docs/tmp/private/b.txt': 'b',
        },
        policy: {
          list: '**',
          stat: '**',
          read: '**',
          write: '**',
          remove: ['docs/tmp', 'docs/tmp/public/**'],
          watch: '**',
          manifest: true,
        },
      });

      await expectFilesMemoryError(
        () => cmd.remove(backing, { path: 'docs/tmp', recursive: true }),
        'FilesMemoryError.PolicyDenied',
      );
      expect(await cmd.read(backing, { path: 'docs/tmp/public/a.txt' })).to.eql({
        kind: 'inline',
        file: { path: 'docs/tmp/public/a.txt', kind: 'file', size: 1 },
        encoding: 'utf8',
        content: 'a',
      });
      expect(await cmd.read(backing, { path: 'docs/tmp/private/b.txt' })).to.eql({
        kind: 'inline',
        file: { path: 'docs/tmp/private/b.txt', kind: 'file', size: 1 },
        encoding: 'utf8',
        content: 'b',
      });
    });
  });

  describe('safety', () => {
    it('rejects invalid write/remove payloads before mutating memory state', async () => {
      const backing = FilesMemory.Writable.create({
        dirs: ['docs'],
        policy: allowAllMutablePolicy,
      });

      await expectFilesMemoryError(
        () => cmd.write(backing, null as never),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => cmd.write(backing, { kind: 'bytes', path: 'new/blob.bin', content: 'bad' } as never),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => cmd.remove(backing, { path: 'docs', recursive: 'yes' } as never),
        'FilesMemoryError.InvalidPath',
      );
      expect(await cmd.list(backing, { path: 'docs' })).to.eql({ entries: [] });
      await expectFilesMemoryError(
        () => cmd.stat(backing, { path: 'new' }),
        'FilesMemoryError.NotFound',
      );
    });
  });
});
