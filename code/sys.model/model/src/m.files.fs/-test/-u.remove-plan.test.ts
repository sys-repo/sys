import { describe, expect, it, type t } from '../../-test.ts';
import { removalEntries, type RemovalTarget } from '../u/u.remove-plan.ts';
import { expectFilesFsError, file, ROOT, writableFsFixture } from './u.fixture.ts';

const allowAllRemove = { remove: '**' } satisfies t.Files.Policy.Shape;

const target = (path = 'docs/tmp'): RemovalTarget => ({
  path: path as t.Files.String.Path,
  absolute: `${ROOT}/${path}` as t.StringAbsolutePath,
  real: `${ROOT}/${path}` as t.StringAbsolutePath,
  kind: 'dir',
});

describe('FilesFs remove planning utilities', () => {
  it('returns a direct non-recursive directory remove plan when the directory is empty', async () => {
    const fixture = writableFsFixture({ nodes: { [`${ROOT}/docs/tmp`]: { kind: 'dir' } } });

    const entries = await removalEntries(
      { fs: fixture.fs, root: fixture.root },
      allowAllRemove,
      target(),
      false,
    );

    expect(entries).to.eql([{ path: 'docs/tmp', absolute: `${ROOT}/docs/tmp` }]);
  });

  it('detects non-recursive non-empty directories without descendant preflight', async () => {
    const fixture = writableFsFixture({ nodes: { [`${ROOT}/docs/tmp`]: { kind: 'dir' } } });
    const fs: t.FilesFs.Capability.Writable = {
      ...fixture.fs,
      walk() {
        fixture.calls.walk++;
        return [{ path: '/outside/secret.txt' as t.StringAbsolutePath, kind: 'file' }];
      },
      lstat(input) {
        throw new Error(`lstat should not be called for ${input}`);
      },
      realPath(input) {
        throw new Error(`realPath should not be called for ${input}`);
      },
    };

    await expectFilesFsError(
      () => removalEntries({ fs, root: fixture.root }, { remove: 'docs/tmp' }, target(), false),
      'FilesFsError.DirectoryNotEmpty',
    );
    expect(fixture.calls.walk).to.eql(1);
  });

  it('orders recursive plans deepest-first and root-last after preflight', async () => {
    const fixture = writableFsFixture({
      nodes: {
        [`${ROOT}/docs/tmp`]: { kind: 'dir' },
        [`${ROOT}/docs/tmp/a`]: { kind: 'dir' },
        [`${ROOT}/docs/tmp/a/b.txt`]: file('b'),
        [`${ROOT}/docs/tmp/c.txt`]: file('c'),
      },
    });

    const entries = await removalEntries(
      { fs: fixture.fs, root: fixture.root },
      allowAllRemove,
      target(),
      true,
    );

    expect(entries.map((entry) => entry.path)).to.eql([
      'docs/tmp/a/b.txt',
      'docs/tmp/c.txt',
      'docs/tmp/a',
      'docs/tmp',
    ]);
  });

  it('preflights descendant policy before returning recursive mutation entries', async () => {
    const fixture = writableFsFixture({
      nodes: {
        [`${ROOT}/docs/tmp`]: { kind: 'dir' },
        [`${ROOT}/docs/tmp/a.txt`]: file('a'),
      },
    });

    await expectFilesFsError(
      () => {
        return removalEntries(
          { fs: fixture.fs, root: fixture.root },
          { remove: 'docs/tmp' },
          target(),
          true,
        );
      },
      'FilesFsError.PolicyDenied',
    );
    expect(fixture.calls.removeEntry).to.eql(0);
  });

  it('rejects recursive descendants that disappear before preflight completes', async () => {
    const fixture = writableFsFixture({ nodes: { [`${ROOT}/docs/tmp`]: { kind: 'dir' } } });
    const missing = `${ROOT}/docs/tmp/missing.txt` as t.StringAbsolutePath;
    const fs: t.FilesFs.Capability.Writable = {
      ...fixture.fs,
      walk() {
        fixture.calls.walk++;
        return [{ path: missing, kind: 'file' }];
      },
    };

    await expectFilesFsError(
      () => removalEntries({ fs, root: fixture.root }, allowAllRemove, target(), true),
      'FilesFsError.NotFound',
    );
    expect(fixture.calls.removeEntry).to.eql(0);
  });

  it('rejects recursive descendants whose real path no longer resolves', async () => {
    const gone = `${ROOT}/docs/tmp/gone.txt` as t.StringAbsolutePath;
    const fixture = writableFsFixture({
      nodes: {
        [`${ROOT}/docs/tmp`]: { kind: 'dir' },
        [gone]: file('gone'),
      },
    });
    const fs: t.FilesFs.Capability.Writable = {
      ...fixture.fs,
      realPath(input) {
        fixture.calls.realPath++;
        const absolute = fixture.fs.Path.resolve(input);
        if (absolute === gone) return undefined;
        return fixture.fs.realPath(input);
      },
    };

    await expectFilesFsError(
      () => removalEntries({ fs, root: fixture.root }, allowAllRemove, target(), true),
      'FilesFsError.NotFound',
    );
    expect(fixture.calls.removeEntry).to.eql(0);
  });

  it('sanitizes raw structural walk failures', async () => {
    const fixture = writableFsFixture({ nodes: { [`${ROOT}/docs/tmp`]: { kind: 'dir' } } });
    const fs: t.FilesFs.Capability.Writable = {
      ...fixture.fs,
      walk(input) {
        fixture.calls.walk++;
        throw new Error(`host walk failed: ${input}`);
      },
    };

    const error = await expectFilesFsError(
      () => removalEntries({ fs, root: fixture.root }, allowAllRemove, target(), true),
      'FilesFsError.Unsupported',
    );
    expect(error.message).to.eql('Remove failed for docs/tmp');
    expect(fixture.calls.removeEntry).to.eql(0);
  });
});
