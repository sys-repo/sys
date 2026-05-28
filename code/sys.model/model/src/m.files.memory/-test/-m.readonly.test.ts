import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesMemory } from '../mod.ts';
import { allowAllPolicy, cmd, expectFilesMemoryError, setup } from './u.fixture.ts';

describe('FilesMemory.Readonly.create', () => {
  describe('surface', () => {
    it('creates a bounded snapshot backing without exposing memory internals', async () => {
      const { backing } = setup({ maxReadBytes: 64, defaultLimit: 2 });

      expect(backing.kind).to.eql('files/memory:readonly');
      expect(backing.policy).to.eql(allowAllPolicy);
      expect(Object.isFrozen(backing.policy)).to.eql(true);
      expect(Object.isFrozen(backing.capabilities)).to.eql(true);
      expect(Object.isFrozen(backing.handlers)).to.eql(true);
      expect('root' in backing).to.eql(false);
      expect('files' in backing).to.eql(false);
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
        maxReadBytes: 64,
        encodings: ['utf8'],
      });
      expectTypeOf(backing).toEqualTypeOf<t.FilesMemory.Readonly>();
    });
  });

  describe('readonly truth', () => {
    it('lists, stats, reads, and manifests root-relative entries from memory', async () => {
      const { backing } = setup();

      const root = await cmd.list(backing, { depth: 1 });
      expect(root).to.eql({
        entries: [
          { path: 'bar.yaml', kind: 'file', size: 10, mediaType: 'application/yaml' },
          { path: 'empty', kind: 'dir' },
          { path: 'foo.json', kind: 'file', size: 16, mediaType: 'application/json' },
          { path: 'notes', kind: 'dir' },
        ],
      });
      expect(root.entries.every((entry: t.Files.Entry) => !entry.path.startsWith('/'))).to.eql(
        true,
      );

      const stat = await cmd.stat(backing, { path: 'notes/baz.md' });
      expect(stat).to.eql({
        entry: { path: 'notes/baz.md', kind: 'file', size: 6, mediaType: 'text/markdown' },
      });

      const read = await cmd.read(backing, { path: 'foo.json' });
      expect(read).to.eql({
        kind: 'inline',
        file: { path: 'foo.json', kind: 'file', size: 16, mediaType: 'application/json' },
        encoding: 'utf8',
        content: '{ "foo": true }\n',
      });

      const manifest = await cmd.manifest(backing, { path: 'notes' });
      expect(manifest).to.eql({
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
          encodings: ['utf8'],
        },
        entries: [
          { path: 'notes/baz.md', kind: 'file', size: 6, mediaType: 'text/markdown' },
        ],
      });
    });
  });

  describe('authority', () => {
    it('keeps default policy deny-all while leaving capabilities observable', async () => {
      const backing = FilesMemory.Readonly.create({ files: { 'foo.txt': 'hello' } });

      expect(await cmd.capabilities(backing)).to.eql({
        list: true,
        stat: true,
        read: true,
        write: false,
        remove: false,
        watch: false,
        manifest: false,
        fidelity: 'snapshot',
        encodings: ['utf8'],
      });
      await expectFilesMemoryError(
        () => cmd.list(backing),
        'FilesMemoryError.PolicyDenied',
      );
      await expectFilesMemoryError(
        () => cmd.read(backing, { path: 'foo.txt' }),
        'FilesMemoryError.PolicyDenied',
      );
    });

    it('snapshots policy and capabilities so caller mutation cannot widen authority', async () => {
      const allow = ['foo.json'];
      const policy = {
        list: allow,
        stat: allow,
        read: allow,
        manifest: true,
      } satisfies t.Files.Policy.Shape;
      const { backing } = setup({ policy });

      allow.push('notes/**');
      (policy as Record<string, unknown>).read = '**';

      expect(Object.isFrozen(backing.policy)).to.eql(true);
      expect(Object.isFrozen(backing.capabilities)).to.eql(true);
      expect(Object.isFrozen(backing.capabilities.encodings)).to.eql(true);
      expect(await cmd.read(backing, { path: 'foo.json' })).to.eql({
        kind: 'inline',
        file: { path: 'foo.json', kind: 'file', size: 16, mediaType: 'application/json' },
        encoding: 'utf8',
        content: '{ "foo": true }\n',
      });
      await expectFilesMemoryError(
        () => cmd.read(backing, { path: 'notes/baz.md' }),
        'FilesMemoryError.PolicyDenied',
      );
    });
  });

  describe('safety', () => {
    it('rejects unsafe source inputs with memory-scoped errors', async () => {
      await expectFilesMemoryError(
        () => FilesMemory.Readonly.create(null as never),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => FilesMemory.Readonly.create(new Map() as never),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => FilesMemory.Readonly.create({ files: 'nope' as never }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => FilesMemory.Readonly.create({ files: new Map() as never }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => FilesMemory.Readonly.create({ dirs: 'nope' as never }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => FilesMemory.Readonly.create({ files: { '../escape.txt': 'nope' } }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => FilesMemory.Readonly.create({ files: { 'safe/../escape.txt': 'nope' } }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => FilesMemory.Readonly.create({ files: { 'bad\\path.txt': 'nope' } }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => {
          return FilesMemory.Readonly.create({
            files: { 'docs': 'file', 'docs/readme.md': 'child' },
          });
        },
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => {
          return FilesMemory.Readonly.create({
            files: { 'bad.txt': { content: 'nope', modifiedAt: 'nope' as never } },
          });
        },
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => {
          return FilesMemory.Readonly.create({
            files: { 'bad.txt': { content: 'nope', hash: 123 as never } },
          });
        },
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => {
          return FilesMemory.Readonly.create({
            files: { 'bad.txt': { content: 'nope', mediaType: 123 as never } },
          });
        },
        'FilesMemoryError.InvalidPath',
      );
    });

    it('rejects unsafe command paths and query payloads with memory-scoped errors', async () => {
      const { backing } = setup();

      await expectFilesMemoryError(
        () => cmd.stat(backing, { path: '/etc/passwd' as t.Files.String.Path }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => cmd.stat(backing, { path: 'notes/..' as t.Files.String.Path }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => cmd.list(backing, { match: [123] as never }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => cmd.list(backing, { depth: -1 }),
        'FilesMemoryError.InvalidPath',
      );
      await expectFilesMemoryError(
        () => cmd.stat(backing, { path: 'missing.txt' }),
        'FilesMemoryError.NotFound',
      );
    });

    it('rejects unsupported write and watch commands before backing work', async () => {
      const { backing } = setup();

      await expectFilesMemoryError(
        () => cmd.write(backing, null as never),
        'FilesMemoryError.Unsupported',
      );
      await expectFilesMemoryError(
        () => cmd.watch(backing, { path: 'notes' }),
        'FilesMemoryError.Unsupported',
      );
    });
  });
});
