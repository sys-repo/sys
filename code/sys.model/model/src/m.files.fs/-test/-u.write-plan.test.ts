import { describe, expect, it, type t } from '../../-test.ts';
import { writeTarget, writtenFileEntry } from '../u/u.write-plan.ts';
import { expectFilesFsError, file, ROOT, writableFsFixture } from './u.fixture.ts';

const scopeOf = (fs: t.FilesFs.Capability.Writable) => ({ fs, root: ROOT });

describe('FilesFs write planning utilities', () => {
  it('preflights created-file targets and ensures missing parent directories', async () => {
    const fixture = writableFsFixture();
    const path = 'docs/new/deep.md' as t.Files.String.Path;

    const target = await writeTarget(scopeOf(fixture.fs), path);

    expect(target).to.eql({ absolute: `${ROOT}/${path}` });
    expect(fixture.calls.ensureDir).to.eql(1);
    expect(fixture.nodes[`${ROOT}/docs/new` as t.StringAbsolutePath]).to.eql({ kind: 'dir' });
  });

  it('reports existing files as previous write targets', async () => {
    const fixture = writableFsFixture();
    const path = 'docs/readme.md' as t.Files.String.Path;

    const target = await writeTarget(scopeOf(fixture.fs), path);

    expect(target).to.eql({
      absolute: `${ROOT}/${path}`,
      previous: { path, kind: 'file', size: 8, mediaType: 'text/markdown' },
    });
  });

  it('rejects existing directory targets before atomic write', async () => {
    const fixture = writableFsFixture();

    await expectFilesFsError(
      () => writeTarget(scopeOf(fixture.fs), 'docs' as t.Files.String.Path),
      'FilesFsError.NotFile',
    );
    expect(fixture.calls.writeFileAtomic).to.eql(0);
  });

  it('rejects parent directories whose final real path escapes even if lstat claims dir', async () => {
    const fixture = writableFsFixture({
      nodes: {
        '/root/docs/alias': { kind: 'dir' },
        '/outside': { kind: 'dir' },
      },
      realPaths: {
        '/root/docs/alias': '/outside' as t.StringAbsolutePath,
      },
    });
    const fs: t.FilesFs.Capability.Writable = {
      ...fixture.fs,
      lstat(input) {
        fixture.calls.lstat++;
        const absolute = fixture.fs.Path.resolve(input);
        if (absolute === '/root/docs/alias') return { kind: 'dir', isDirectory: true };
        return fixture.fs.lstat(input);
      },
    };

    await expectFilesFsError(
      () => writeTarget(scopeOf(fs), 'docs/alias/new.md' as t.Files.String.Path),
      'FilesFsError.PathOutsideRoot',
    );
    expect(fixture.calls.writeFileAtomic).to.eql(0);
  });

  it('reads written file metadata from durable truth after mutation', async () => {
    const fixture = writableFsFixture();
    const path = 'docs/written.md' as t.Files.String.Path;
    const absolute = `${ROOT}/${path}` as t.StringAbsolutePath;
    fixture.nodes[absolute] = file('ok', 'text/markdown');

    const entry = await writtenFileEntry(scopeOf(fixture.fs), path, absolute);

    expect(entry).to.eql({ path, kind: 'file', size: 2, mediaType: 'text/markdown' });
  });
});
