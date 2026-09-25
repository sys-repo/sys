import { afterEach, describe, expect, Files, it, type t } from '../../-test.ts';
import { R2 } from '../mod.ts';
import { bytesObject, fakeBucket, r2FilesPolicy as policy, textObject } from './u.fixture.ts';

const clients = new Set<ReturnType<typeof Files.Client.local>>();
const localFiles = (...args: Parameters<typeof Files.Client.local>) => {
  const client = Files.Client.local(...args);
  clients.add(client);
  return client;
};

afterEach(() => {
  for (const client of clients) client.dispose('test.cleanup');
  clients.clear();
});

describe('R2.Files', () => {
  describe('capabilities / object keys', () => {
    it('exports a writable Files backing with resolved capabilities', async () => {
      const { bucket } = fakeBucket();
      const backing = R2.Files.create({ bucket, policy });
      const files = localFiles(backing);

      expect(backing.kind).to.equal('files/r2:writable');
      expect(backing.policy).to.eql(policy);
      expect(await files.capabilities()).to.eql({
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

    it('maps Files writes through the configured R2 object-key prefix', async () => {
      const { bucket, store, calls } = fakeBucket();
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: 'deploy/main' }));

      const text = await files.writeText('index.html', 'hello', { mediaType: 'text/html' });
      const bytes = await files.writeBytes('assets/app.bin', new Uint8Array([1, 2, 3]), {
        mediaType: 'application/octet-stream',
      });

      expect(text.kind).to.equal('created');
      expect(text.entry?.mediaType).to.equal('text/html');
      expect(bytes.entry?.size).to.equal(3);
      expect(bytes.entry?.mediaType).to.equal('application/octet-stream');
      expect([...store.keys()].sort()).to.eql([
        'deploy/main/assets/app.bin',
        'deploy/main/index.html',
      ]);
      expect(calls).to.eql([
        ['list', { prefix: 'deploy/main/index.html/', limit: 1 }],
        ['stat', 'deploy/main/index.html'],
        ['write', 'deploy/main/index.html', 'hello', {
          size: 5,
          mediaType: 'text/html',
          custom: { 'sys.files.body': 'text', 'sys.files.encoding': 'utf8' },
        }],
        ['stat', 'deploy/main/assets'],
        ['list', { prefix: 'deploy/main/assets/app.bin/', limit: 1 }],
        ['stat', 'deploy/main/assets/app.bin'],
        ['write', 'deploy/main/assets/app.bin', new Uint8Array([1, 2, 3]), {
          size: 3,
          mediaType: 'application/octet-stream',
          custom: { 'sys.files.body': 'bytes' },
        }],
      ]);
    });
  });

  describe('tree views', () => {
    it('stats and lists a deterministic Files tree synthesized from object keys', async () => {
      const { bucket } = fakeBucket({
        'deploy/main/index.html': textObject('hello', 'text/html'),
        'deploy/main/assets/app.js': textObject('console.log(1)', 'text/javascript'),
      });
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: '/deploy/main/' }));

      expect(await files.stat('assets')).to.eql({ path: 'assets', kind: 'dir' });
      expect(await files.stat('index.html')).to.include({
        path: 'index.html',
        kind: 'file',
        size: 5,
        mediaType: 'text/html',
      });

      const listed = await files.list({ depth: 1 });
      expect(listed.entries).to.eql([
        { path: 'assets', kind: 'dir' },
        { path: 'index.html', kind: 'file', size: 5, modifiedAt: 1780272000000 },
      ]);

      const page = await files.list({ limit: 1 });
      expect(page.entries).to.eql([{ path: 'assets', kind: 'dir' }]);
      expect(Files.Cursor.Is.list(page.cursor)).to.equal(true);
    });
  });

  describe('read', () => {
    it('returns inline text only for Files text metadata and URL refs only with readOrigin', async () => {
      const { bucket } = fakeBucket({
        'deploy/main/index.html': {
          ...textObject('hello', 'text/html'),
          custom: { 'Sys.Files.Body': 'text', 'SYS.FILES.ENCODING': 'utf8' },
        },
        'deploy/main/assets/app.wasm': bytesObject(new Uint8Array([0, 1]), 'application/wasm'),
      }, 'https://cdn.example.com/root');
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: 'deploy/main' }));

      expect(await files.readText('index.html')).to.equal('hello');
      const read = await files.cmd.send('files:read', { path: 'assets/app.wasm' });

      expect(read).to.eql({
        kind: 'ref',
        file: {
          path: 'assets/app.wasm',
          kind: 'file',
          size: 2,
          modifiedAt: 1780272000000,
          mediaType: 'application/wasm',
        },
        contentRef: {
          kind: 'url',
          path: 'assets/app.wasm',
          size: 2,
          mediaType: 'application/wasm',
          url: 'https://cdn.example.com/root/deploy/main/assets/app.wasm',
        },
      });
    });

    it('API-reads textual byte objects when readOrigin is omitted', async () => {
      const body = '{"ok":true}';
      const { bucket, calls } = fakeBucket({
        'deploy/main/dist.json': bytesObject(new TextEncoder().encode(body), 'application/json'),
      });
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: 'deploy/main' }));

      expect(await files.readText('dist.json')).to.equal(body);
      expect(calls).to.eql([
        ['stat', 'deploy/main/dist.json'],
        ['list', { prefix: 'deploy/main/dist.json/', limit: 1 }],
        ['read', 'deploy/main/dist.json'],
      ]);
    });

    it('API-reads canonical explicit textual media types', async () => {
      const encoder = new TextEncoder();
      const { bucket } = fakeBucket({
        'deploy/main/plain.bin': bytesObject(
          encoder.encode('plain'),
          'text/plain; charset=UTF-8',
        ),
        'deploy/main/structured.bin': bytesObject(
          encoder.encode('structured'),
          'application/vnd.api+json; version=1',
        ),
        'deploy/main/yaml.bin': bytesObject(
          encoder.encode('yaml'),
          'application/example+yaml',
        ),
        'deploy/main/typescript.bin': bytesObject(
          encoder.encode('typescript'),
          'application/typescript',
        ),
        'deploy/main/typescript-jsx.bin': bytesObject(
          encoder.encode('typescript-jsx'),
          'application/typescript+jsx',
        ),
      });
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: 'deploy/main' }));

      expect(await files.readText('plain.bin')).to.equal('plain');
      expect(await files.readText('structured.bin')).to.equal('structured');
      expect(await files.readText('yaml.bin')).to.equal('yaml');
      expect(await files.readText('typescript.bin')).to.equal('typescript');
      expect(await files.readText('typescript-jsx.bin')).to.equal('typescript-jsx');
    });

    it('API-reads textual byte objects by path when provider media metadata is absent', async () => {
      const json = '{"ok":true}';
      const yaml = 'ok: true';
      const { bucket } = fakeBucket({
        'deploy/main/dist.json': bytesObject(new TextEncoder().encode(json)),
        'deploy/main/config.yaml': bytesObject(new TextEncoder().encode(yaml)),
      });
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: 'deploy/main' }));

      expect(await files.readText('dist.json')).to.equal(json);
      expect(await files.readText('config.yaml')).to.equal(yaml);
    });

    it('API-reads textual byte objects when provider size is invalid', async () => {
      const body = '{"ok":true}';
      const object = bytesObject(new TextEncoder().encode(body), 'application/json');
      const { bucket } = fakeBucket({
        'deploy/main/dist.json': { ...object, size: Number.NaN },
      });
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: 'deploy/main' }));

      expect(await files.readText('dist.json')).to.equal(body);
    });

    it('enforces maxBytes against streamed API response bytes', async () => {
      const object = bytesObject(
        new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x7d]),
        'application/json',
      );
      const fixture = fakeBucket({
        'deploy/main/dist.json': { ...object, size: Number.NaN },
      });
      let pulls = 0;
      const bucket: t.R2.Bucket = {
        ...fixture.bucket,
        read() {
          return Promise.resolve(
            new Response(
              new ReadableStream<Uint8Array>({
                pull(controller) {
                  pulls += 1;
                  controller.enqueue(
                    pulls === 1 ? new Uint8Array([0xef, 0xbb, 0xbf]) : new Uint8Array([0x7b, 0x7d]),
                  );
                  if (pulls >= 3) controller.close();
                },
              }),
            ),
          );
        },
      };
      const backing = R2.Files.create({ bucket, policy, prefix: 'deploy/main' });

      await rejectsName(
        () => read(backing, { path: 'dist.json', maxBytes: 2 }),
        /FilesR2Error\.ReadTooLarge/,
      );
      expect(pulls < 3).to.equal(true);
    });

    it('preserves explicit binary media metadata over textual path derivation', async () => {
      const { bucket } = fakeBucket({
        'deploy/main/dist.json': bytesObject(
          new TextEncoder().encode('{"ok":true}'),
          'application/octet-stream',
        ),
      });
      const backing = R2.Files.create({ bucket, policy, prefix: 'deploy/main' });

      await rejectsName(
        () => read(backing, { path: 'dist.json' }),
        /FilesR2Error\.Unsupported/,
      );
    });

    it('rejects binary reads without readOrigin content refs', async () => {
      const { bucket } = fakeBucket({
        'deploy/main/assets/app.wasm': bytesObject(new Uint8Array([0, 1]), 'application/wasm'),
        'deploy/main/source/main.ts': bytesObject(new TextEncoder().encode('const value = 1;')),
      });
      const backing = R2.Files.create({ bucket, policy, prefix: 'deploy/main' });

      await rejectsName(
        () => read(backing, { path: 'assets/app.wasm' }),
        /FilesR2Error\.Unsupported/,
      );
      await rejectsName(
        () => read(backing, { path: 'source/main.ts' }),
        /FilesR2Error\.Unsupported/,
      );
    });

    it('rejects invalid UTF-8 after textual admission', async () => {
      const { bucket } = fakeBucket({
        'deploy/main/dist.json': bytesObject(new Uint8Array([0xff]), 'application/json'),
      });
      const backing = R2.Files.create({ bucket, policy, prefix: 'deploy/main' });

      await rejects(
        () => read(backing, { path: 'dist.json' }),
        /Unsupported UTF-8 read content/,
      );
    });
  });

  describe('content refs / manifest', () => {
    it('omits invalid provider sizes from Files entries and URL refs', async () => {
      const object = bytesObject(new Uint8Array([1, 2]), 'application/json');
      const { bucket } = fakeBucket({
        'deploy/main/dist.json': { ...object, size: Number.NaN },
      }, 'https://cdn.example.com/root');
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: 'deploy/main' }));

      expect(await files.stat('dist.json')).to.eql({
        path: 'dist.json',
        kind: 'file',
        modifiedAt: 1780272000000,
        mediaType: 'application/json',
      });

      const read = await files.cmd.send('files:read', { path: 'dist.json' });

      expect(read).to.eql({
        kind: 'ref',
        file: {
          path: 'dist.json',
          kind: 'file',
          modifiedAt: 1780272000000,
          mediaType: 'application/json',
        },
        contentRef: {
          kind: 'url',
          path: 'dist.json',
          mediaType: 'application/json',
          url: 'https://cdn.example.com/root/deploy/main/dist.json',
        },
      });
    });

    it('encodes URL content-ref path segments without changing object-key semantics', async () => {
      const { bucket } = fakeBucket({
        'deploy/main/docs/a b+c?.txt': bytesObject(new Uint8Array([1]), 'text/plain'),
      }, 'https://cdn.example.com/root');
      const files = localFiles(R2.Files.create({ bucket, policy, prefix: 'deploy/main' }));

      const read = await files.cmd.send('files:read', { path: 'docs/a b+c?.txt' });

      expect(read.kind).to.equal('ref');
      if (read.kind !== 'ref') throw new Error('expected ref');
      expect(read.contentRef).to.eql({
        kind: 'url',
        path: 'docs/a b+c?.txt',
        size: 1,
        mediaType: 'text/plain',
        url: 'https://cdn.example.com/root/deploy/main/docs/a%20b%2Bc%3F.txt',
      });
    });

    it('manifests URL refs only for read-authorized files', async () => {
      const readOnlyHtml: t.Files.Policy.Shape = {
        list: '**',
        stat: '**',
        read: '*.html',
        manifest: true,
      };
      const { bucket } = fakeBucket({
        'index.html': textObject('hello', 'text/html'),
        'secret.txt': textObject('secret', 'text/plain'),
      }, 'https://cdn.example.com');
      const files = localFiles(R2.Files.create({ bucket, policy: readOnlyHtml }));

      const manifest = await files.manifest({ contentRefs: true });

      expect(manifest.entries.map((entry) => entry.path)).to.eql(['index.html', 'secret.txt']);
      expect(manifest.contentRefs).to.eql([
        {
          kind: 'url',
          path: 'index.html',
          size: 5,
          mediaType: 'text/html',
          url: 'https://cdn.example.com/index.html',
        },
      ]);
    });

    it('skips manifest content refs when stat disappears after listing', async () => {
      const fixture = fakeBucket({
        'keep.html': textObject('keep', 'text/html'),
        'gone.html': textObject('gone', 'text/html'),
      }, 'https://cdn.example.com');
      const bucket: t.R2.Bucket = {
        ...fixture.bucket,
        stat(key) {
          if (key === 'gone.html') return Promise.resolve(undefined);
          return fixture.bucket.stat(key);
        },
      };
      const files = localFiles(R2.Files.create({ bucket, policy }));

      const manifest = await files.manifest({ contentRefs: true });

      expect(manifest.entries.map((entry) => entry.path)).to.eql(['gone.html', 'keep.html']);
      expect(manifest.contentRefs?.map((ref) => ref.path)).to.eql(['keep.html']);
    });
  });

  describe('errors / mutation policy', () => {
    it('normalizes provider errors into the Files/R2 error domain', async () => {
      const fixture = fakeBucket();
      const bucket: t.R2.Bucket = {
        ...fixture.bucket,
        // Deliberately throws before this async iterable can yield.
        // deno-lint-ignore require-yield
        async *list() {
          throw new Error('provider list failed');
        },
      };
      const backing = R2.Files.create({ bucket, policy });

      await rejectsName(() => list(backing, {}), /FilesR2Error\.Unsupported/);
    });

    it('allows max-length object keys without probing impossible descendant prefixes', async () => {
      const { bucket, calls } = fakeBucket();
      const backing = R2.Files.create({ bucket, policy });
      const path = 'x'.repeat(1024) as t.Files.String.Path;

      await write(backing, { kind: 'text', path, content: 'x' });

      expect(calls).to.eql([
        ['stat', path],
        ['write', path, 'x', {
          size: 1,
          custom: { 'sys.files.body': 'text', 'sys.files.encoding': 'utf8' },
        }],
      ]);
    });

    it('applies Files remove semantics before deleting R2 objects', async () => {
      const { bucket, store } = fakeBucket({
        'assets/app.js': textObject('app'),
        'assets/app.css': textObject('css'),
      });
      const backing = R2.Files.create({ bucket, policy });
      const files = localFiles(backing);

      await rejects(() => remove(backing, { path: 'assets' }), /Directory not empty/);
      await files.remove('assets', { recursive: true });
      expect([...store.keys()]).to.eql([]);
      await rejects(() => remove(backing, { path: 'missing.txt' }), /Path not found/);
    });

    it('rejects tree collisions, root writes, and oversized object keys', async () => {
      const { bucket } = fakeBucket({
        a: textObject('file'),
        'a/b.txt': textObject('child'),
      });
      const backing = R2.Files.create({ bucket, policy });

      await rejects(() => stat(backing, { path: 'a' }), /tree collision/);
      await rejects(() => write(backing, { kind: 'text', path: '', content: 'root' }), /root/);
      await rejects(
        () => write(backing, { kind: 'text', path: 'a/b/c.txt', content: 'x' }),
        /Not a directory/,
      );
      await rejects(
        () => write(backing, { kind: 'text', path: 'x'.repeat(1025), content: 'x' }),
        /exceeds 1024/,
      );
    });

    it('policy denial prevents bucket mutation', async () => {
      const { bucket, store, calls } = fakeBucket({ 'denied.txt': textObject('no') });
      const denied: t.Files.Policy.Shape = { list: '**', stat: '**', read: '**' };
      const backing = R2.Files.create({ bucket, policy: denied });

      await rejects(
        () => write(backing, { kind: 'text', path: 'denied.txt', content: 'yes' }),
        /Write denied/,
      );
      await rejects(() => remove(backing, { path: 'denied.txt' }), /Remove denied/);
      expect(store.get('denied.txt')?.body).to.equal('no');
      expect(calls).to.eql([]);
    });
  });
});

/**
 * Helpers:
 */

function list(backing: t.R2.Files.Writable, payload: t.Files.Cmd.List.Payload) {
  return backing.handlers['files:list'](payload, undefined as never);
}

function stat(backing: t.R2.Files.Writable, payload: t.Files.Cmd.Stat.Payload) {
  return backing.handlers['files:stat'](payload, undefined as never);
}

function write(backing: t.R2.Files.Writable, payload: t.Files.Cmd.Write.Payload) {
  return backing.handlers['files:write'](payload, undefined as never);
}

function read(backing: t.R2.Files.Writable, payload: t.Files.Cmd.Read.Payload) {
  return backing.handlers['files:read'](payload, undefined as never);
}

function remove(backing: t.R2.Files.Writable, payload: t.Files.Cmd.Remove.Payload) {
  return backing.handlers['files:remove'](payload, undefined as never);
}

async function rejectsName(run: () => unknown | Promise<unknown>, pattern: RegExp): Promise<void> {
  try {
    await run();
  } catch (error) {
    expect(errorNames(error).some((name) => pattern.test(name))).to.equal(true);
    return;
  }
  throw new Error(`Expected rejection named ${pattern}`);
}

async function rejects(run: () => unknown | Promise<unknown>, pattern: RegExp): Promise<void> {
  try {
    await run();
  } catch (error) {
    expect(errorMessages(error).some((message) => pattern.test(message))).to.equal(true);
    return;
  }
  throw new Error(`Expected rejection matching ${pattern}`);
}

function errorNames(error: unknown): string[] {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    return [error.name, ...(cause === undefined ? [] : errorNames(cause))];
  }
  if (error && typeof error === 'object') {
    const record = error as { name?: unknown; error?: unknown; cause?: unknown };
    return [
      ...(typeof record.name === 'string' ? [record.name] : []),
      ...(record.error === undefined ? [] : errorNames(record.error)),
      ...(record.cause === undefined ? [] : errorNames(record.cause)),
    ];
  }
  return [];
}

function errorMessages(error: unknown): string[] {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    return [error.message, ...(cause === undefined ? [] : errorMessages(cause))];
  }
  if (error && typeof error === 'object') {
    const record = error as { message?: unknown; error?: unknown; cause?: unknown };
    return [
      ...(typeof record.message === 'string' ? [record.message] : []),
      ...(record.error === undefined ? [] : errorMessages(record.error)),
      ...(record.cause === undefined ? [] : errorMessages(record.cause)),
    ];
  }
  return [String(error)];
}
