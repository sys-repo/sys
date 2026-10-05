import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Files } from '../mod.ts';
import {
  cmd,
  escapingFixture,
  expectFilesFsError,
  file,
  type NodeMap,
  ROOT,
  setupWritable,
  writableFsFixture,
} from './u.fixture.ts';

const WRITABLE_SUPPORTS = {
  list: true,
  stat: true,
  read: true,
  write: true,
  remove: true,
  manifest: true,
} satisfies Partial<t.Files.Capability.Map>;

const allowAllMutablePolicy = {
  list: '**',
  stat: '**',
  read: '**',
  write: '**',
  remove: '**',
  manifest: true,
} satisfies t.Files.Policy.Shape;

describe('FilesFs.Writable', () => {
  it('create exposes bounded writable commands without live diagnostics', async () => {
    const { backing } = setupWritable({
      policy: allowAllMutablePolicy,
      maxReadBytes: 64,
      maxWriteBytes: 16,
    });

    expect(backing.kind).to.eql('files/fs:writable');
    expect(Object.isFrozen(backing.policy)).to.eql(true);
    expect(Object.isFrozen(backing.capabilities)).to.eql(true);
    expect(Object.isFrozen(backing.handlers)).to.eql(true);
    expect(backing).to.not.have.property('diagnostics');
    expect(backing).to.not.have.property('root');
    expect(backing).to.not.have.property('fs');
    expectTypeOf(backing).toEqualTypeOf<t.FilesFs.Writable>();
    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
      write: true,
      remove: true,
      watch: false,
      manifest: true,
      fidelity: 'dynamic',
      maxReadBytes: 64,
      maxWriteBytes: 16,
      encodings: ['utf8'],
    });
    await expectFilesFsError(
      () => cmd.watch(backing, { path: 'docs' }),
      'FilesFsError.Unsupported',
    );
  });

  it('create mutates durable filesystem truth through write and remove commands', async () => {
    const { backing } = setupWritable({ policy: allowAllMutablePolicy });
    const path = 'docs/new.md' as t.Files.String.Path;

    const created = await cmd.write(backing, {
      kind: 'text',
      path,
      content: 'new\n',
      mediaType: 'text/markdown',
    });
    expect(created).to.eql({
      kind: 'created',
      path,
      entry: { path, kind: 'file', size: 4, mediaType: 'text/markdown' },
    });
    expect(await cmd.read(backing, { path })).to.eql({
      kind: 'inline',
      file: { path, kind: 'file', size: 4, mediaType: 'text/markdown' },
      encoding: 'utf8',
      content: 'new\n',
    });
    expect((await cmd.list(backing, { path: 'docs' })).entries.some((entry) => entry.path === path))
      .to.eql(true);

    const modified = await cmd.write(backing, { kind: 'text', path, content: 'newer\n' });
    expect(modified).to.eql({
      kind: 'modified',
      path,
      entry: { path, kind: 'file', size: 6 },
    });
    expect(await cmd.read(backing, { path })).to.eql({
      kind: 'inline',
      file: { path, kind: 'file', size: 6 },
      encoding: 'utf8',
      content: 'newer\n',
    });

    const bytesPath = 'docs/data.bin' as t.Files.String.Path;
    const bytes = await cmd.write(backing, {
      kind: 'bytes',
      path: bytesPath,
      content: new Uint8Array([65, 66]),
      mediaType: 'application/octet-stream',
    });
    expect(bytes).to.eql({
      kind: 'created',
      path: bytesPath,
      entry: { path: bytesPath, kind: 'file', size: 2, mediaType: 'application/octet-stream' },
    });
    expect(await cmd.read(backing, { path: bytesPath })).to.eql({
      kind: 'inline',
      file: { path: bytesPath, kind: 'file', size: 2, mediaType: 'application/octet-stream' },
      encoding: 'utf8',
      content: 'AB',
    });

    const removed = await cmd.remove(backing, { path });
    expect(removed).to.eql({ kind: 'deleted', path });
    await expectFilesFsError(
      () => cmd.stat(backing, { path }),
      'FilesFsError.NotFound',
    );
  });

  it('live emits command-origin write/remove hints while read remains truth', async () => {
    const fixture = writableFsFixture();
    const fs = liveWritableFs(fixture.fs);
    const backing = Files.Fs.Writable.live({
      fs,
      root: fixture.root,
      policy: { ...allowAllMutablePolicy, watch: '**' },
    });
    const events: t.Files.Change[] = [];
    const controller = new AbortController();
    const watchDone = backing.handlers['files:watch']({ path: 'docs' }, {
      id: 'req-files-fs-writable-live-watch-test' as t.Cmd.ReqId,
      name: Files.Cmd.Name.watch,
      ns: Files.Cmd.ns,
      signal: controller.signal,
      emit(event: t.Files.Change) {
        events.push(event);
      },
    });

    await backing.diagnostics.Active.whenActive();
    const path = 'docs/live.md' as t.Files.String.Path;
    const written = await cmd.write(backing, { kind: 'text', path, content: 'live\n' });

    expect(written).to.eql({
      kind: 'created',
      path,
      entry: { path, kind: 'file', size: 5 },
      seq: 1,
      correlation: 'req-files-fs-test',
    });
    expect(events.at(-1)).to.eql({
      kind: 'created',
      path,
      entry: { path, kind: 'file', size: 5 },
      seq: 1,
      origin: 'command',
      correlation: 'req-files-fs-test',
    });
    expect(await cmd.read(backing, { path })).to.eql({
      kind: 'inline',
      file: { path, kind: 'file', size: 5 },
      encoding: 'utf8',
      content: 'live\n',
    });

    const removed = await cmd.remove(backing, { path });
    expect(removed).to.eql({
      kind: 'deleted',
      path,
      seq: 2,
      correlation: 'req-files-fs-test',
    });
    expect(events.at(-1)).to.eql({
      kind: 'deleted',
      path,
      seq: 2,
      origin: 'command',
      correlation: 'req-files-fs-test',
    });
    await expectFilesFsError(
      () => cmd.stat(backing, { path }),
      'FilesFsError.NotFound',
    );

    controller.abort('test.stop');
    await watchDone;
  });

  it('derives writable capability truth from Files.Authority', async () => {
    const { backing } = setupWritable({
      policy: allowAllMutablePolicy,
      maxReadBytes: 64,
      maxWriteBytes: 16,
    });
    const authority = Files.Authority.resolve({
      policy: backing.policy,
      backing: {
        supports: WRITABLE_SUPPORTS,
        fidelity: 'dynamic',
        maxReadBytes: 64,
        maxWriteBytes: 16,
        encodings: ['utf8'],
      },
    });

    expect(backing.capabilities).to.eql(authority.capabilities);
    expect(await cmd.capabilities(backing)).to.eql(authority.capabilities);

    const manifest = await cmd.manifest(backing, { path: 'docs' });
    expect(manifest['.meta'].capabilities).to.eql(authority.capabilities);
  });

  describe('safety contracts', () => {
    it('enforces encoded-byte maxWriteBytes before mutation', async () => {
      const { backing, calls, nodes } = setupWritable({
        policy: { ...allowAllMutablePolicy, maxWriteBytes: 1 },
        maxWriteBytes: 64,
      });

      await expectFilesFsError(
        () => cmd.write(backing, { kind: 'text', path: 'docs/two.txt', content: 'é' }),
        'FilesFsError.WriteTooLarge',
      );
      await expectFilesFsError(
        () => {
          return cmd.write(backing, {
            kind: 'bytes',
            path: 'docs/two.bin',
            content: new Uint8Array([0, 1]),
          });
        },
        'FilesFsError.WriteTooLarge',
      );
      expect(calls.writeFileAtomic).to.eql(0);
      expect(nodes[`${ROOT}/docs/two.txt` as t.StringAbsolutePath]).to.eql(undefined);
      expect(nodes[`${ROOT}/docs/two.bin` as t.StringAbsolutePath]).to.eql(undefined);
    });

    it('rejects root and path-traversal mutations before backing mutation', async () => {
      const { backing, calls } = setupWritable({ policy: allowAllMutablePolicy });

      await expectFilesFsError(
        () => cmd.write(backing, { kind: 'text', path: '', content: 'root' }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => cmd.remove(backing, { path: '' }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => cmd.write(backing, { kind: 'text', path: '../outside.txt', content: 'no' }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => cmd.remove(backing, { path: '../outside.txt' }),
        'FilesFsError.InvalidPath',
      );
      expect(calls.writeFileAtomic).to.eql(0);
      expect(calls.removeEntry).to.eql(0);
    });

    it('rejects invalid, directory-target, and policy-denied writes before mutation', async () => {
      const open = setupWritable({ policy: allowAllMutablePolicy });

      await expectFilesFsError(
        () => cmd.write(open.backing, { kind: 'text', path: '', content: 'root' }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => cmd.write(open.backing, { kind: 'text', path: 'docs', content: 'dir' }),
        'FilesFsError.NotFile',
      );
      expect(open.calls.writeFileAtomic).to.eql(0);

      const denied = setupWritable({
        policy: { ...allowAllMutablePolicy, write: 'docs/allowed.md' },
      });
      await expectFilesFsError(
        () => cmd.write(denied.backing, { kind: 'text', path: 'docs/blocked.md', content: 'no' }),
        'FilesFsError.PolicyDenied',
      );
      expect(denied.calls.writeFileAtomic).to.eql(0);
    });

    it('sanitizes atomic write failures and leaves target truth unchanged', async () => {
      const fixture = writableFsFixture();
      const path = 'docs/readme.md' as t.Files.String.Path;
      const absolute = `${ROOT}/${path}` as t.StringAbsolutePath;
      const before = fixture.nodes[absolute];
      const fs: t.FilesFs.Capability.Writable = {
        ...fixture.fs,
        writeFileAtomic() {
          fixture.calls.writeFileAtomic++;
          throw new Error(`host write failed: ${absolute}`);
        },
      };
      const backing = Files.Fs.Writable.create({
        fs,
        root: fixture.root,
        policy: allowAllMutablePolicy,
      });

      const error = await expectFilesFsError(
        () => cmd.write(backing, { kind: 'text', path, content: 'changed\n' }),
        'FilesFsError.Unsupported',
      );
      expect(error.message).to.eql(`Write failed: ${path}`);
      expect(fixture.calls.writeFileAtomic).to.eql(1);
      expect(fixture.nodes[absolute]).to.eql(before);
      expect(await cmd.read(backing, { path })).to.eql({
        kind: 'inline',
        file: { path, kind: 'file', size: 8, mediaType: 'text/markdown' },
        encoding: 'utf8',
        content: '# Readme',
      });
    });

    it('keeps atomic write scratch entries out of Files projection on success', async () => {
      const fixture = writableFsFixture();
      const temp = `${ROOT}/docs/.atomic.tmp` as t.StringAbsolutePath;
      const fs: t.FilesFs.Capability.Writable = {
        ...fixture.fs,
        writeFileAtomic(input, content, options) {
          fixture.nodes[temp] = file('temp', 'text/plain');
          delete fixture.nodes[temp];
          return fixture.fs.writeFileAtomic(input, content, options);
        },
      };
      const backing = Files.Fs.Writable.create({
        fs,
        root: fixture.root,
        policy: allowAllMutablePolicy,
      });

      await cmd.write(backing, { kind: 'text', path: 'docs/atomic.md', content: 'ok' });
      expect(fixture.nodes[temp]).to.eql(undefined);
      const listed = await cmd.list(backing, { path: 'docs' });
      expect(listed.entries.some((entry) => entry.path === 'docs/.atomic.tmp')).to.eql(false);
    });

    it('rejects symlink escape targets and parent directories before mutation', async () => {
      const target = setupWritable({ fs: escapingFixture(), policy: allowAllMutablePolicy });

      await expectFilesFsError(
        () => cmd.write(target.backing, { kind: 'text', path: 'link-out.txt', content: 'x' }),
        'FilesFsError.PathOutsideRoot',
      );
      await expectFilesFsError(
        () => cmd.remove(target.backing, { path: 'link-out.txt' }),
        'FilesFsError.PathOutsideRoot',
      );
      expect(target.calls.writeFileAtomic).to.eql(0);
      expect(target.calls.removeEntry).to.eql(0);

      const inside = setupWritable({
        fs: {
          nodes: { '/root/docs/link-in.md': file('alias', 'text/plain') },
          realPaths: {
            '/root/docs/link-in.md': '/root/docs/readme.md' as t.StringAbsolutePath,
          },
        },
        policy: allowAllMutablePolicy,
      });
      await expectFilesFsError(
        () => cmd.write(inside.backing, { kind: 'text', path: 'docs/link-in.md', content: 'x' }),
        'FilesFsError.Unsupported',
      );
      await expectFilesFsError(
        () => cmd.remove(inside.backing, { path: 'docs/link-in.md' }),
        'FilesFsError.Unsupported',
      );
      expect(inside.calls.writeFileAtomic).to.eql(0);
      expect(inside.calls.removeEntry).to.eql(0);

      const parent = setupWritable({
        fs: {
          nodes: {
            '/root/docs/link-out': { kind: 'dir' },
            '/outside': { kind: 'dir' },
          },
          realPaths: {
            '/root/docs/link-out': '/outside' as t.StringAbsolutePath,
          },
        },
        policy: allowAllMutablePolicy,
      });
      await expectFilesFsError(
        () => {
          return cmd.write(parent.backing, {
            kind: 'text',
            path: 'docs/link-out/new.md',
            content: 'x',
          });
        },
        'FilesFsError.PathOutsideRoot',
      );
      expect(parent.calls.writeFileAtomic).to.eql(0);

      const hostileParent = writableFsFixture({
        nodes: {
          '/root/docs/alias': { kind: 'dir' },
          '/outside': { kind: 'dir' },
        },
        realPaths: {
          '/root/docs/alias': '/outside' as t.StringAbsolutePath,
        },
      });
      const hostileFs: t.FilesFs.Capability.Writable = {
        ...hostileParent.fs,
        lstat(input) {
          hostileParent.calls.lstat++;
          const absolute = hostileParent.fs.Path.resolve(input);
          if (absolute === '/root/docs/alias') return { kind: 'dir', isDirectory: true };
          return hostileParent.fs.lstat(input);
        },
      };
      const hostileBacking = Files.Fs.Writable.create({
        fs: hostileFs,
        root: hostileParent.root,
        policy: allowAllMutablePolicy,
      });
      await expectFilesFsError(
        () => {
          return cmd.write(hostileBacking, {
            kind: 'text',
            path: 'docs/alias/new.md',
            content: 'x',
          });
        },
        'FilesFsError.PathOutsideRoot',
      );
      expect(hostileParent.calls.writeFileAtomic).to.eql(0);
    });

    it('sanitizes structural mutation probe failures before exposing errors', async () => {
      const fixture = writableFsFixture();
      const fs: t.FilesFs.Capability.Writable = {
        ...fixture.fs,
        lstat(input) {
          fixture.calls.lstat++;
          throw new Error(`lstat failed: ${input}`);
        },
      };
      const backing = Files.Fs.Writable.create({
        fs,
        root: fixture.root,
        policy: allowAllMutablePolicy,
      });

      const writeError = await expectFilesFsError(
        () => cmd.write(backing, { kind: 'text', path: 'docs/new.md', content: 'x' }),
        'FilesFsError.Unsupported',
      );
      expect(writeError.message).to.eql('Write failed: docs/new.md');

      const removeError = await expectFilesFsError(
        () => cmd.remove(backing, { path: 'docs/readme.md' }),
        'FilesFsError.Unsupported',
      );
      expect(removeError.message).to.eql('Remove failed for docs/readme.md');
      expect(fixture.calls.writeFileAtomic).to.eql(0);
      expect(fixture.calls.removeEntry).to.eql(0);
    });

    it('rejects policy-denied removes before mutation', async () => {
      const { backing, calls } = setupWritable({
        policy: { ...allowAllMutablePolicy, remove: 'docs/allowed.md' },
      });

      await expectFilesFsError(
        () => cmd.remove(backing, { path: 'docs/readme.md' }),
        'FilesFsError.PolicyDenied',
      );
      expect(calls.removeEntry).to.eql(0);
    });

    it('returns DirectoryNotEmpty for non-recursive dirs before descendant policy checks', async () => {
      const { backing, calls } = setupWritable({
        fs: { nodes: tmpNodes() },
        policy: { ...allowAllMutablePolicy, remove: 'docs/tmp' },
      });

      await expectFilesFsError(
        () => cmd.remove(backing, { path: 'docs/tmp' }),
        'FilesFsError.DirectoryNotEmpty',
      );
      expect(calls.removeEntry).to.eql(0);
    });

    it('does not run descendant containment/policy preflight for non-recursive dirs', async () => {
      const fixture = writableFsFixture({
        nodes: { '/root/docs/tmp': { kind: 'dir' } },
      });
      const fs: t.FilesFs.Capability.Writable = {
        ...fixture.fs,
        walk() {
          fixture.calls.walk++;
          return [{ path: '/outside/secret.txt' as t.StringAbsolutePath, kind: 'file' }];
        },
      };
      const backing = Files.Fs.Writable.create({
        fs,
        root: fixture.root,
        policy: { ...allowAllMutablePolicy, remove: 'docs/tmp' },
      });

      await expectFilesFsError(
        () => cmd.remove(backing, { path: 'docs/tmp' }),
        'FilesFsError.DirectoryNotEmpty',
      );
      expect(fixture.calls.walk).to.eql(1);
      expect(fixture.calls.removeEntry).to.eql(0);
    });

    it('preflights descendant policy before recursive remove mutation', async () => {
      const { backing, calls, nodes } = setupWritable({
        fs: { nodes: tmpNodes() },
        policy: { ...allowAllMutablePolicy, remove: 'docs/tmp' },
      });

      await expectFilesFsError(
        () => cmd.remove(backing, { path: 'docs/tmp', recursive: true }),
        'FilesFsError.PolicyDenied',
      );
      expect(calls.removeEntry).to.eql(0);
      expect(nodes[`${ROOT}/docs/tmp/a.txt` as t.StringAbsolutePath]).to.eql(file('a'));
      expect(nodes[`${ROOT}/docs/tmp/b.txt` as t.StringAbsolutePath]).to.eql(file('b'));
    });

    it('reports recursive remove partial failures after preflight without host paths', async () => {
      const fixture = writableFsFixture({ nodes: tmpNodes() });
      const root = `${ROOT}/docs/tmp` as t.StringAbsolutePath;
      const fs: t.FilesFs.Capability.Writable = {
        ...fixture.fs,
        removeEntry(input) {
          const absolute = fixture.fs.Path.resolve(input);
          if (absolute === root) throw new Error(`host remove failed: ${absolute}`);
          return fixture.fs.removeEntry(input);
        },
      };
      const backing = Files.Fs.Writable.create({
        fs,
        root: fixture.root,
        policy: allowAllMutablePolicy,
      });

      const error = await expectFilesFsError(
        () => cmd.remove(backing, { path: 'docs/tmp', recursive: true }),
        'FilesFsError.PartialFailure',
      );
      expect(error.message).to.eql(
        'Remove partially failed for docs/tmp; failed at docs/tmp; deleted 2 entries',
      );
      expect(fixture.nodes[`${ROOT}/docs/tmp/a.txt` as t.StringAbsolutePath]).to.eql(undefined);
      expect(fixture.nodes[`${ROOT}/docs/tmp/b.txt` as t.StringAbsolutePath]).to.eql(undefined);
      expect(fixture.nodes[root]).to.eql({ kind: 'dir' });
    });
  });
});

function tmpNodes(): NodeMap {
  const dir = `${ROOT}/docs/tmp` as t.StringAbsolutePath;
  const a = `${ROOT}/docs/tmp/a.txt` as t.StringAbsolutePath;
  const b = `${ROOT}/docs/tmp/b.txt` as t.StringAbsolutePath;
  return {
    [dir]: { kind: 'dir' },
    [a]: file('a'),
    [b]: file('b'),
  };
}

function liveWritableFs(
  fs: t.FilesFs.Capability.Writable,
): t.FilesFs.Capability.LiveWritable {
  return {
    ...fs,
    watch(path) {
      return {
        $: {
          subscribe() {
            return { unsubscribe() {} };
          },
        },
        paths: [path],
        exists: true,
        dispose() {},
      };
    },
  };
}
