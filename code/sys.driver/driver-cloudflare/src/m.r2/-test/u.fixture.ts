import { Bytes, Obj, Str, type t } from '../../-test.ts';

export const accountId = '0123456789abcdef0123456789abcdef';

export const credentials = {
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
} as const;

export const r2FilesPolicy: t.Files.Policy.Shape = {
  list: '**',
  stat: '**',
  read: '**',
  write: '**',
  remove: '**',
  manifest: true,
};

export type StoredObject = {
  readonly body: string | Uint8Array<ArrayBuffer>;
  readonly size: number;
  readonly mediaType?: string;
  readonly custom?: t.R2.MetadataCustom;
  readonly modifiedAt: Date;
};

export function fakeTransport(calls: unknown[] = []): t.R2.Bucket.TransportFactory {
  return () => ({
    stat(key) {
      calls.push(['stat', key]);
      return Promise.resolve({ key, size: 5, etag: 'stat-etag' });
    },
    read(key) {
      calls.push(['read', key]);
      return Promise.resolve(new Response('hello'));
    },
    write(key, data, options) {
      calls.push(['write', key, data, options]);
      return Promise.resolve({ etag: 'write-etag' });
    },
    remove(key) {
      calls.push(['remove', key]);
      return Promise.resolve();
    },
    async *list(options) {
      calls.push(['list', options]);
      yield { key: 'assets/app.js', size: 12 };
    },
  });
}

export function fakeBucket(
  initial: Record<string, StoredObject> = {},
  readOrigin?: string,
): {
  readonly bucket: t.R2.Bucket;
  readonly store: Map<string, StoredObject>;
  readonly calls: unknown[];
} {
  const store = new Map<string, StoredObject>(Obj.entries(initial));
  const calls: unknown[] = [];
  const bucket: t.R2.Bucket = {
    name: 'assets',
    readOrigin,
    stat(key) {
      calls.push(['stat', key]);
      const object = store.get(key);
      return Promise.resolve(object === undefined ? undefined : meta(key, object));
    },
    read(key) {
      calls.push(['read', key]);
      const object = store.get(key);
      if (!object) return Promise.reject(new Error(`missing: ${key}`));
      return Promise.resolve(new Response(object.body));
    },
    write(key, data, options) {
      calls.push(['write', key, data, options]);
      store.set(key, {
        body: data instanceof Uint8Array ? new Uint8Array(data) : String(data),
        size: options?.size ?? (data instanceof Uint8Array ? data.byteLength : String(data).length),
        mediaType: options?.mediaType,
        custom: options?.custom,
        modifiedAt: modifiedAt(),
      });
      return Promise.resolve({ etag: 'etag' });
    },
    remove(key) {
      calls.push(['remove', key]);
      store.delete(key);
      return Promise.resolve();
    },
    async *list(options) {
      calls.push(['list', options]);
      let count = 0;
      const compare = Str.Compare.codeUnit();
      for (const [key, object] of [...store.entries()].sort((a, b) => compare(a[0], b[0]))) {
        if (options?.prefix !== undefined && !key.startsWith(options.prefix)) continue;
        if (options?.limit !== undefined && count >= options.limit) break;
        count++;
        yield { key, size: object.size, modifiedAt: object.modifiedAt };
      }
    },
  };
  return { bucket, store, calls };
}

export function textObject(body: string, mediaType?: string): StoredObject {
  return {
    body,
    size: Bytes.utf8ByteLength(body),
    mediaType,
    custom: { 'sys.files.body': 'text', 'sys.files.encoding': 'utf8' },
    modifiedAt: modifiedAt(),
  };
}

export function bytesObject(body: Uint8Array, mediaType?: string): StoredObject {
  const bytes = new Uint8Array(body);
  return {
    body: bytes,
    size: bytes.byteLength,
    mediaType,
    custom: { 'sys.files.body': 'bytes' },
    modifiedAt: modifiedAt(),
  };
}

function meta(key: string, object: StoredObject): t.R2.ObjectMeta {
  return {
    key,
    size: object.size,
    modifiedAt: object.modifiedAt,
    metadata: {
      ...(object.mediaType === undefined ? {} : { mediaType: object.mediaType }),
      ...(object.custom === undefined ? {} : { custom: object.custom }),
    },
  };
}

function modifiedAt(): Date {
  return new Date('2026-06-01T00:00:00.000Z');
}
