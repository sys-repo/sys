import { describe, expect, it, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { allowDocsPolicy, cmd, expectFilesFsError, setup } from './u.fixture.ts';

describe('FilesFs.Readonly.create: paging', () => {
  describe('paging truth', () => {
    it('uses kind-scoped cursors for list and manifest paging', async () => {
      const { backing } = setup({ policy: allowDocsPolicy, defaultLimit: 2 });

      const first = await cmd.list(backing, { path: 'docs' });
      expect(first.entries.map((entry) => entry.path)).to.eql([
        'docs/nested',
        'docs/nested/guide.md',
      ]);
      expect(first.truncated).to.eql(true);
      expect(Files.Cursor.Is.list(first.cursor)).to.eql(true);

      const second = await cmd.list(backing, { path: 'docs', cursor: first.cursor });
      expect(second.entries.map((entry) => entry.path)).to.eql([
        'docs/private',
        'docs/private/secret.md',
      ]);
      expect(second.truncated).to.eql(true);
      expect(Files.Cursor.Is.list(second.cursor)).to.eql(true);

      const manifest = await cmd.manifest(backing, { path: 'docs', limit: 1 });
      expect(manifest.entries.map((entry) => entry.path)).to.eql(['docs/nested']);
      expect(manifest['.meta'].page?.truncated).to.eql(true);
      expect(Files.Cursor.Is.manifest(manifest['.meta'].page?.cursor)).to.eql(true);
    });
  });

  describe('safety', () => {
    it('rejects invalid cursors before host walk IO', async () => {
      const { backing, calls } = setup({ policy: allowDocsPolicy });
      const cursor = Files.Cursor.create('manifest', '0');

      await expectFilesFsError(
        () => cmd.list(backing, { path: 'docs', cursor }),
        'FilesFsError.InvalidPath',
      );
      expect(calls.walk).to.eql(0);
    });

    it('rejects invalid list query filters before host IO', async () => {
      const invalidDepth = setup({ policy: allowDocsPolicy });
      await expectFilesFsError(
        () => cmd.list(invalidDepth.backing, { path: 'docs', depth: -1 }),
        'FilesFsError.InvalidPath',
      );
      expect(invalidDepth.calls.realPath).to.eql(0);
      expect(invalidDepth.calls.stat).to.eql(0);
      expect(invalidDepth.calls.walk).to.eql(0);

      const invalidMatch = setup({ policy: allowDocsPolicy });
      await expectFilesFsError(
        () => cmd.list(invalidMatch.backing, { path: 'docs', match: [123] as never }),
        'FilesFsError.InvalidPath',
      );
      expect(invalidMatch.calls.realPath).to.eql(0);
      expect(invalidMatch.calls.stat).to.eql(0);
      expect(invalidMatch.calls.walk).to.eql(0);

      const invalidManifestExclude = setup({ policy: allowDocsPolicy });
      await expectFilesFsError(
        () => {
          return cmd.manifest(invalidManifestExclude.backing, {
            path: 'docs',
            exclude: new Map() as unknown as t.Files.Match,
          });
        },
        'FilesFsError.InvalidPath',
      );
      expect(invalidManifestExclude.calls.realPath).to.eql(0);
      expect(invalidManifestExclude.calls.stat).to.eql(0);
      expect(invalidManifestExclude.calls.walk).to.eql(0);
    });

    it('rejects invalid page limits before host walk IO', async () => {
      const invalidList = setup({ policy: allowDocsPolicy });
      await expectFilesFsError(
        () => cmd.list(invalidList.backing, { path: 'docs', limit: 0 }),
        'FilesFsError.InvalidPath',
      );
      expect(invalidList.calls.walk).to.eql(0);

      const invalidManifest = setup({ policy: allowDocsPolicy });
      await expectFilesFsError(
        () => cmd.manifest(invalidManifest.backing, { path: 'docs', limit: -1 }),
        'FilesFsError.InvalidPath',
      );
      expect(invalidManifest.calls.walk).to.eql(0);

      await expectFilesFsError(
        () => setup({ policy: allowDocsPolicy, defaultLimit: 0 }),
        'FilesFsError.InvalidPath',
      );
    });
  });
});
