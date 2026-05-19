import { describe, expect, it } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { allowDocsPolicy, cmd, expectFilesFsError, setup } from './u.fixture.ts';

describe('FilesFs.readonly: paging', () => {
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
    expect(manifest.truncated).to.eql(true);
    expect(Files.Cursor.Is.manifest(manifest.cursor)).to.eql(true);

    await expectFilesFsError(
      () => cmd.list(backing, { path: 'docs', cursor: manifest.cursor }),
      'FilesFsError.InvalidPath',
    );
  });

  it('rejects invalid page limits', async () => {
    const { backing } = setup({ policy: allowDocsPolicy });

    await expectFilesFsError(
      () => cmd.list(backing, { path: 'docs', limit: 0 }),
      'FilesFsError.InvalidPath',
    );
    await expectFilesFsError(
      () => cmd.manifest(backing, { path: 'docs', limit: -1 }),
      'FilesFsError.InvalidPath',
    );

    const invalidDefault = setup({ policy: allowDocsPolicy, defaultLimit: 0 });
    await expectFilesFsError(
      () => cmd.list(invalidDefault.backing, { path: 'docs' }),
      'FilesFsError.InvalidPath',
    );
  });
});
