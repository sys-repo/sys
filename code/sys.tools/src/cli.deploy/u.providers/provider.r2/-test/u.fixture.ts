import { Err, Files, Fs, Hash, Pkg, R2, type t } from '../../common.ts';

export type Write = { path: string; bytes: readonly number[]; mediaType?: string };
export type Remove = { path: string };
export type Event = `write:${string}` | 'list' | `remove:${string}`;

export type StoredObject = {
  readonly body: Uint8Array;
  readonly mediaType?: string;
  readonly custom?: t.R2.MetadataCustom;
  readonly modifiedAt: Date;
};

export async function stageDist(cwd: t.StringDir): Promise<t.StringDir> {
  const stagingDir = Fs.join(cwd, 'stage') as t.StringDir;
  await Fs.ensureDir(stagingDir);
  await Fs.write(Fs.join(stagingDir, 'index.html'), '<!doctype html><html>r2</html>\n');
  await Fs.write(Fs.join(stagingDir, 'asset.bin'), new Uint8Array([0, 1, 2, 3]));
  await Pkg.Dist.compute({ dir: stagingDir, save: true });
  return stagingDir;
}

export async function loadStagedDist(stagingDir: t.StringDir): Promise<t.DistPkg> {
  const dist = (await Pkg.Dist.load(stagingDir)).dist;
  if (!dist) throw Err.std('missing staged dist');
  return dist;
}

export function r2Provider(): t.DeployTool.Config.Provider.R2 {
  return {
    kind: 'r2',
    accountId: 'account-1',
    bucket: 'deploy-bucket',
    prefix: 'deploy/site',
    readOrigin: 'https://cdn.example.com',
    credentials: { accessKeyId: 'key-1', secretAccessKey: 'secret-1' },
  };
}

export function r2Target(cwd: t.StringDir, stagingDir: t.StringDir): t.R2PushTarget {
  return {
    provider: r2Provider(),
    sourceDir: cwd,
    stagingDir,
    domain: 'https://cdn.example.com',
  };
}

export function localR2FilesHandle(args: {
  readonly store: Map<string, StoredObject>;
  readonly prefix?: string;
}): t.Files.Client.Handle {
  const bucket = localBucket(args.store);
  const backing = R2.Files.create({
    bucket,
    prefix: args.prefix ?? 'deploy/site',
    policy: { list: '**', stat: '**', read: '**', write: '**', remove: '**', manifest: true },
  });
  return Files.Client.local(backing);
}

export function filesHandle(args: {
  writes: Write[];
  removes?: Remove[];
  events?: Event[];
  remoteText?: string;
  remoteRefText?: string;
  entries?: readonly t.Files.Entry[];
  listPages?: readonly t.Files.Cmd.List.Result[];
  listError?: unknown;
  removeError?: unknown;
}): t.Files.Client.Handle {
  let listPageIndex = 0;
  return {
    dispose() {},
    cmd: {
      async send() {
        if (args.remoteText !== undefined) {
          return { kind: 'inline', content: args.remoteText };
        }
        if (args.remoteRefText !== undefined) {
          return {
            kind: 'ref',
            contentRef: {
              kind: 'url',
              path: 'dist.json',
              url: dataUrl(args.remoteRefText),
            },
          };
        }
        throw new Error('remote dist unavailable');
      },
    },
    async list() {
      args.events?.push('list');
      if (args.listError) throw args.listError;
      if (args.listPages) return args.listPages[listPageIndex++] ?? { entries: [] };
      return { entries: args.entries ?? [] };
    },
    async writeBytes(
      path: t.Files.String.Path,
      content: Uint8Array,
      options?: t.Files.Client.Write.BytesOptions,
    ) {
      args.events?.push(`write:${path}`);
      args.writes.push({ path, bytes: [...content], mediaType: options?.mediaType });
      return { kind: 'created', path };
    },
    async remove(path: t.Files.String.Path) {
      args.events?.push(`remove:${path}`);
      if (args.removeError) throw args.removeError;
      args.removes?.push({ path });
      return { kind: 'deleted', path };
    },
  } as unknown as t.Files.Client.Handle;
}

export function sha(seed: string): t.StringHash {
  return Hash.sha256(seed) as t.StringHash;
}

function dataUrl(text: string): t.StringUrl {
  return `data:application/json;charset=utf-8,${encodeURIComponent(text)}` as t.StringUrl;
}

function localBucket(store: Map<string, StoredObject>): t.R2.Bucket {
  return {
    name: 'deploy-bucket',
    stat(key) {
      const object = store.get(key);
      return Promise.resolve(object === undefined ? undefined : toObjectMeta(key, object));
    },
    read(key) {
      const object = store.get(key);
      if (!object) return Promise.reject(new Error(`missing object: ${key}`));
      const body = new ArrayBuffer(object.body.byteLength);
      new Uint8Array(body).set(object.body);
      return Promise.resolve(new Response(body));
    },
    write(key, data, options) {
      const body = data instanceof Uint8Array
        ? new Uint8Array(data)
        : new TextEncoder().encode(String(data));
      store.set(key, {
        body,
        mediaType: options?.mediaType,
        custom: options?.custom,
        modifiedAt: new Date('2026-06-01T00:00:00.000Z'),
      });
      return Promise.resolve({ etag: 'etag' });
    },
    remove(key) {
      store.delete(key);
      return Promise.resolve();
    },
    async *list(options) {
      const keys = [...store.keys()].sort();
      let count = 0;
      for (const key of keys) {
        if (options?.prefix !== undefined && !key.startsWith(options.prefix)) continue;
        if (options?.limit !== undefined && count >= options.limit) break;
        count += 1;
        const object = store.get(key);
        if (!object) continue;
        yield { key, size: object.body.byteLength, modifiedAt: object.modifiedAt };
      }
    },
  };
}

function toObjectMeta(key: string, object: StoredObject): t.R2.ObjectMeta {
  return {
    key,
    size: object.body.byteLength,
    modifiedAt: object.modifiedAt,
    metadata: {
      ...(object.mediaType === undefined ? {} : { mediaType: object.mediaType }),
      ...(object.custom === undefined ? {} : { custom: object.custom }),
    },
  };
}
