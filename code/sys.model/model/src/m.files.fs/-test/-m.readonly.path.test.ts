import { describe, expect, it, type t } from '../../-test.ts';
import {
  allowAllPolicy,
  allowDocsPolicy,
  cmd,
  escapingFixture,
  expectFilesFsError,
  setup,
} from './u.fixture.ts';

describe('FilesFs.readonly: path safety', () => {
  it('lists, stats, reads, and manifests only root-relative entries under policy', async () => {
    const { backing } = setup({ policy: allowDocsPolicy });

    const list = await cmd.list(backing, { path: 'docs' });
    expect(list).to.eql({
      entries: [
        { path: 'docs/nested', kind: 'dir' },
        {
          path: 'docs/nested/guide.md',
          kind: 'file',
          size: 7,
          mediaType: 'text/markdown',
        },
        { path: 'docs/private', kind: 'dir' },
        {
          path: 'docs/private/secret.md',
          kind: 'file',
          size: 6,
          mediaType: 'text/markdown',
        },
        { path: 'docs/readme.md', kind: 'file', size: 8, mediaType: 'text/markdown' },
      ],
    });
    expect(list.entries.every((entry) => !entry.path.startsWith('/'))).to.eql(true);

    const stat = await cmd.stat(backing, { path: 'docs/readme.md' });
    expect(stat).to.eql({
      entry: { path: 'docs/readme.md', kind: 'file', size: 8, mediaType: 'text/markdown' },
    });

    const read = await cmd.read(backing, { path: 'docs/readme.md' });
    expect(read).to.eql({
      kind: 'inline',
      file: { path: 'docs/readme.md', kind: 'file', size: 8, mediaType: 'text/markdown' },
      encoding: 'utf8',
      content: '# Readme',
    });

    const manifest = await cmd.manifest(backing, { path: 'docs', depth: 1 });
    expect(manifest).to.eql({
      version: 'sys.files.manifest.v1',
      capabilities: {
        list: true,
        stat: true,
        read: true,
        watch: false,
        manifest: true,
        encodings: ['utf8'],
      },
      entries: [
        { path: 'docs/nested', kind: 'dir' },
        { path: 'docs/private', kind: 'dir' },
        { path: 'docs/readme.md', kind: 'file', size: 8, mediaType: 'text/markdown' },
      ],
    });
    expect(manifest.entries.every((entry) => !entry.path.startsWith('/'))).to.eql(true);
  });

  it('classifies missing paths and wrong entry kinds without leaking host paths', async () => {
    const { backing } = setup({ policy: allowAllPolicy });

    await expectFilesFsError(
      () => cmd.stat(backing, { path: 'missing.txt' }),
      'FilesFsError.NotFound',
    );
    await expectFilesFsError(
      () => cmd.read(backing, { path: 'docs' }),
      'FilesFsError.NotFile',
    );
    await expectFilesFsError(
      () => cmd.list(backing, { path: 'docs/readme.md' }),
      'FilesFsError.NotDirectory',
    );
  });

  it('rejects missing required command paths', async () => {
    const { backing } = setup({ policy: allowAllPolicy });

    await expectFilesFsError(
      () => cmd.stat(backing, {} as t.Files.Cmd.Stat.Payload),
      'FilesFsError.InvalidPath',
    );
  });

  it('rejects host-absolute and root-escaping visible paths', async () => {
    const { backing } = setup({ policy: allowAllPolicy });
    const invalid = [
      '/etc/passwd',
      '../outside.txt',
      'docs/..',
      'docs/../readme.md',
      'docs/../../outside.txt',
      'docs\\readme.md',
      'bad\0path',
      'C:/Windows/system.ini',
    ];

    for (const path of invalid) {
      await expectFilesFsError(
        () => cmd.stat(backing, { path }),
        'FilesFsError.InvalidPath',
      );
    }
  });

  it('rejects real-path escapes before stat/read can expose escaped targets', async () => {
    const { backing } = setup({ fs: escapingFixture(), policy: allowAllPolicy });

    await expectFilesFsError(
      () => cmd.stat(backing, { path: 'link-out.txt' }),
      'FilesFsError.PathOutsideRoot',
    );
    await expectFilesFsError(
      () => cmd.read(backing, { path: 'link-out.txt' }),
      'FilesFsError.PathOutsideRoot',
    );
    await expectFilesFsError(() => cmd.list(backing), 'FilesFsError.PathOutsideRoot');
  });
});
