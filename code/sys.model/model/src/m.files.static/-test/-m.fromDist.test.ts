import { Files } from '../../m.files/mod.ts';
import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesStatic } from '../mod.ts';
import {
  allowAllPolicy,
  baseUrl,
  buildTime,
  cmd,
  dist,
  expectFilesStaticError,
  Hash,
  part,
  setup,
} from './u.fixture.ts';

const STATIC_SUPPORTS = {
  list: true,
  stat: true,
  read: true,
  manifest: true,
} satisfies Partial<t.Files.Capability.Map>;

describe('FilesStatic.fromDist', () => {
  it('exports the public runtime surface', async () => {
    const m = await import('@sys/model/files/static');

    expect(m.FilesStatic).to.equal(FilesStatic);
    expect(Object.keys(FilesStatic).sort()).to.eql(['fromDist']);
    expectTypeOf(FilesStatic).toMatchTypeOf<t.FilesStatic.Lib>();
  });

  it('creates a bounded static snapshot backing from dist.json metadata', async () => {
    const { backing } = setup({ defaultLimit: 2 });

    expect(backing.kind).to.eql('files/static:dist');
    expect(backing.policy).to.eql(allowAllPolicy);
    expect(Object.isFrozen(backing.policy)).to.eql(true);
    expect(Object.isFrozen(backing.capabilities)).to.eql(true);
    expect(Object.isFrozen(backing.handlers)).to.eql(true);
    expect('dist' in backing).to.eql(false);
    expect('baseUrl' in backing).to.eql(false);
    expect(Object.keys(backing.handlers).sort()).to.eql([
      'files:capabilities',
      'files:list',
      'files:manifest',
      'files:read',
      'files:remove',
      'files:stat',
      'files:watch',
      'files:write',
    ]);
    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
      write: false,
      remove: false,
      watch: false,
      manifest: true,
      fidelity: 'snapshot',
    });
    expectTypeOf(backing).toEqualTypeOf<t.FilesStatic.Readonly>();

    const authority = Files.Authority.resolve({
      policy: backing.policy,
      backing: { supports: STATIC_SUPPORTS, fidelity: 'snapshot' },
    });
    expect(backing.capabilities).to.eql(authority.capabilities);
  });

  it('lists, stats, reads refs, and manifests root-relative static entries', async () => {
    const { backing } = setup();

    const root = await cmd.list(backing, { depth: 1 });
    expect(root).to.eql({
      entries: [
        { path: 'foo.json', kind: 'file', size: 16, hash: Hash.foo },
        { path: 'notes', kind: 'dir' },
        { path: 'private', kind: 'dir' },
      ],
    });
    expect(root.entries.every((entry: t.Files.Entry) => !entry.path.startsWith('/'))).to.eql(true);

    const stat = await cmd.stat(backing, { path: 'notes/baz.md' });
    expect(stat).to.eql({
      entry: { path: 'notes/baz.md', kind: 'file', size: 6, hash: Hash.baz },
    });

    const read = await cmd.read(backing, { path: 'foo.json' });
    expect(read).to.eql({
      kind: 'ref',
      file: { path: 'foo.json', kind: 'file', size: 16, hash: Hash.foo },
      contentRef: {
        kind: 'url',
        path: 'foo.json',
        size: 16,
        hash: Hash.foo,
        url: `${baseUrl}foo.json`,
      },
    });

    const manifest = await cmd.manifest(backing, { path: 'notes', content: true });
    expect(manifest).to.eql({
      '.meta': {
        version: 'sys.files.manifest:v1',
        capabilities: {
          list: true,
          stat: true,
          read: true,
          write: false,
          remove: false,
          watch: false,
          manifest: true,
          fidelity: 'snapshot',
        },
        dist: { build: { time: buildTime } },
      },
      entries: [
        { path: 'notes/baz.md', kind: 'file', size: 6, hash: Hash.baz },
      ],
      content: [
        {
          kind: 'url',
          path: 'notes/baz.md',
          size: 6,
          hash: Hash.baz,
          url: `${baseUrl}notes/baz.md`,
        },
      ],
    });
  });

  it('returns hash content refs when no base URL is provided', async () => {
    const { backing } = setup({ baseUrl: undefined });

    const read = await cmd.read(backing, { path: 'foo.json' });
    expect(read).to.eql({
      kind: 'ref',
      file: { path: 'foo.json', kind: 'file', size: 16, hash: Hash.foo },
      contentRef: { kind: 'hash', path: 'foo.json', size: 16, hash: Hash.foo },
    });
  });

  it('keeps default policy deny-all while leaving capabilities observable', async () => {
    const backing = FilesStatic.fromDist({ dist: dist({ 'foo.txt': part(Hash.foo, 5) }) });

    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
      write: false,
      remove: false,
      watch: false,
      manifest: false,
      fidelity: 'snapshot',
    });
    await expectFilesStaticError(
      () => cmd.list(backing),
      'FilesStaticError.PolicyDenied',
    );
    await expectFilesStaticError(
      () => cmd.read(backing, { path: 'foo.txt' }),
      'FilesStaticError.PolicyDenied',
    );
  });

  it('snapshots policy and omits denied entries without widening static authority', async () => {
    const allow = ['**'];
    const deny = ['private', 'private/**'];
    const policy = Files.Policy.readonly(allow, { deny });
    const { backing } = setup({ policy });

    allow.push('private/**');
    deny.length = 0;
    (policy as Record<string, unknown>).deny = undefined;

    const root = await cmd.list(backing, { depth: 2 });
    expect(root.entries.map((entry: t.Files.Entry) => entry.path)).to.eql([
      'foo.json',
      'notes',
      'notes/baz.md',
    ]);
    await expectFilesStaticError(
      () => cmd.read(backing, { path: 'private/secret.txt' }),
      'FilesStaticError.PolicyDenied',
    );
  });

  it('emits manifest content refs only for read-authorized files', async () => {
    const policy = {
      list: '**',
      stat: '**',
      read: 'foo.json',
      manifest: true,
    } satisfies t.Files.Policy.Shape;
    const { backing } = setup({ policy });

    const manifest = await cmd.manifest(backing, { content: true });
    expect(manifest.entries.map((entry: t.Files.Entry) => entry.path)).to.eql([
      'foo.json',
      'notes',
      'notes/baz.md',
      'private',
      'private/secret.txt',
    ]);
    expect(manifest.content).to.eql([
      { kind: 'url', path: 'foo.json', size: 16, hash: Hash.foo, url: `${baseUrl}foo.json` },
    ]);
  });

  it('pages list and manifest results with Files cursors', async () => {
    const { backing } = setup({ defaultLimit: 2 });

    const first = await cmd.list(backing);
    expect(first.entries.map((entry: t.Files.Entry) => entry.path)).to.eql(['foo.json', 'notes']);
    expect(first.truncated).to.eql(true);
    expect(Files.Cursor.Is.list(first.cursor)).to.eql(true);

    const second = await cmd.list(backing, { cursor: first.cursor });
    expect(second).to.eql({
      entries: [
        { path: 'notes/baz.md', kind: 'file', size: 6, hash: Hash.baz },
        { path: 'private', kind: 'dir' },
      ],
      cursor: Files.Cursor.create('list', '4'),
      truncated: true,
    });

    const manifest = await cmd.manifest(backing, { limit: 1, content: true });
    expect(manifest.entries).to.eql([{ path: 'foo.json', kind: 'file', size: 16, hash: Hash.foo }]);
    expect(manifest.content).to.eql([
      { kind: 'url', path: 'foo.json', size: 16, hash: Hash.foo, url: `${baseUrl}foo.json` },
    ]);
    expect(manifest['.meta'].page?.truncated).to.eql(true);
    expect(Files.Cursor.Is.manifest(manifest['.meta'].page?.cursor)).to.eql(true);
  });

  it('classifies static command errors precisely', async () => {
    const { backing } = setup();

    await expectFilesStaticError(
      () => cmd.list(backing, { path: 'missing' }),
      'FilesStaticError.NotFound',
    );
    await expectFilesStaticError(
      () => cmd.list(backing, { path: 'foo.json' }),
      'FilesStaticError.NotDirectory',
    );
    await expectFilesStaticError(
      () => cmd.read(backing, { path: 'notes' }),
      'FilesStaticError.NotFile',
    );
    await expectFilesStaticError(
      () => cmd.stat(backing, { path: 'missing.txt' }),
      'FilesStaticError.NotFound',
    );

    const noManifest = FilesStatic.fromDist({
      dist: dist({ 'foo.txt': part(Hash.foo, 5) }),
      policy: { list: '**' },
    });
    await expectFilesStaticError(
      () => cmd.manifest(noManifest),
      'FilesStaticError.PolicyDenied',
    );
  });

  it('applies match, exclude, scoped list, and depth filters deterministically', async () => {
    const { backing } = setup({
      dist: dist({
        'docs/readme.md': part(Hash.foo, 1),
        'docs/deep/nested.md': part(Hash.baz, 2),
        'other.md': part(Hash.secret, 3),
      }),
    });

    const matched = await cmd.list(backing, { match: '**/*.md' });
    expect(matched.entries.map((entry: t.Files.Entry) => entry.path)).to.eql([
      'docs/deep/nested.md',
      'docs/readme.md',
      'other.md',
    ]);

    const excluded = await cmd.list(backing, { exclude: ['docs/deep', 'docs/deep/**'] });
    expect(excluded.entries.map((entry: t.Files.Entry) => entry.path)).to.eql([
      'docs',
      'docs/readme.md',
      'other.md',
    ]);

    const scoped = await cmd.list(backing, { path: 'docs', depth: 1 });
    expect(scoped.entries.map((entry: t.Files.Entry) => entry.path)).to.eql([
      'docs/deep',
      'docs/readme.md',
    ]);
  });

  it('handles dist refs and URL edge cases without widening authority', async () => {
    await expectFilesStaticError(
      () => {
        return FilesStatic.fromDist({
          dist: dist({ 'bad.txt': 'not-a-part' as t.StringFileHashUri }),
        });
      },
      'FilesStaticError.InvalidPath',
    );
    await expectFilesStaticError(
      () => {
        return FilesStatic.fromDist({
          dist: dist({ 'docs/readme.md': part(Hash.foo, 1), docs: part(Hash.docs, 1) }),
        });
      },
      'FilesStaticError.InvalidPath',
    );
    await expectFilesStaticError(
      () => {
        return FilesStatic.fromDist({
          dist: dist({ 'foo.txt': part(Hash.foo, 1) }),
          baseUrl: 123 as never,
        });
      },
      'FilesStaticError.InvalidPath',
    );
    await expectFilesStaticError(
      () => {
        return FilesStatic.fromDist({
          dist: dist({ 'foo.txt': part(Hash.foo, 1) }),
          baseUrl: 'not a url' as t.StringUrl,
        });
      },
      'FilesStaticError.InvalidPath',
    );

    const noSlash = setup({
      dist: dist({ 'foo.txt': part(Hash.foo, 1) }),
      baseUrl: 'https://example.test/data' as t.StringUrl,
    });
    expect(await cmd.read(noSlash.backing, { path: 'foo.txt' })).to.eql({
      kind: 'ref',
      file: { path: 'foo.txt', kind: 'file', size: 1, hash: Hash.foo },
      contentRef: {
        kind: 'url',
        path: 'foo.txt',
        size: 1,
        hash: Hash.foo,
        url: 'https://example.test/data/foo.txt',
      },
    });

    const encoded = setup({
      dist: dist({ 'docs/a b+c.txt': part(Hash.baz, 2) }),
      baseUrl: 'https://example.test/data' as t.StringUrl,
    });
    expect(await cmd.read(encoded.backing, { path: 'docs/a b+c.txt' })).to.eql({
      kind: 'ref',
      file: { path: 'docs/a b+c.txt', kind: 'file', size: 2, hash: Hash.baz },
      contentRef: {
        kind: 'url',
        path: 'docs/a b+c.txt',
        size: 2,
        hash: Hash.baz,
        url: 'https://example.test/data/docs/a%20b%2Bc.txt',
      },
    });

    const noSize = setup({
      dist: dist({ 'nosize.txt': Hash.foo }),
      baseUrl: undefined,
    });
    expect(await cmd.stat(noSize.backing, { path: 'nosize.txt' })).to.eql({
      entry: { path: 'nosize.txt', kind: 'file', hash: Hash.foo },
    });
    expect(await cmd.read(noSize.backing, { path: 'nosize.txt' })).to.eql({
      kind: 'ref',
      file: { path: 'nosize.txt', kind: 'file', hash: Hash.foo },
      contentRef: { kind: 'hash', path: 'nosize.txt', hash: Hash.foo },
    });
  });

  it('rejects unsafe dist inputs and unsupported watch/read variants', async () => {
    await expectFilesStaticError(
      () => FilesStatic.fromDist({ dist: null as never }),
      'FilesStaticError.InvalidPath',
    );
    await expectFilesStaticError(
      () => FilesStatic.fromDist({ dist: dist({ '../escape.txt': part(Hash.foo, 1) }) }),
      'FilesStaticError.InvalidPath',
    );
    await expectFilesStaticError(
      () => FilesStatic.fromDist({ dist: dist({ '/absolute.txt': part(Hash.foo, 1) }) }),
      'FilesStaticError.InvalidPath',
    );
    await expectFilesStaticError(
      () => FilesStatic.fromDist({ dist: dist({ 'bad\\path.txt': part(Hash.foo, 1) }) }),
      'FilesStaticError.InvalidPath',
    );
    await expectFilesStaticError(
      () => {
        return FilesStatic.fromDist({
          dist: dist({ docs: part(Hash.docs, 1), 'docs/readme.md': part(Hash.foo, 1) }),
        });
      },
      'FilesStaticError.InvalidPath',
    );

    const { backing } = setup();
    await expectFilesStaticError(
      () => cmd.read(backing, { path: 'foo.json', encoding: 'latin1' as t.Files.Encoding }),
      'FilesStaticError.Unsupported',
    );
    const watch = await expectFilesStaticError(
      () => cmd.watch(backing),
      'FilesStaticError.Unsupported',
    );
    expect(watch.message).to.eql('Static dist backing does not support watch');
    await expectFilesStaticError(
      () => cmd.watch(backing, null as never),
      'FilesStaticError.Unsupported',
    );
  });
});
