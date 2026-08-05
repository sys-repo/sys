import { Arr, Is, Obj, type t } from '../common.ts';
import { contentTypeFromPath } from './u.contentTypeFromPath.ts';

type Method = t.HttpServer.ServeFileBytes.Method;
type ReadResult = t.HttpServer.ServeFileBytes.Read.Result;

const FAILURE_STATUS: Record<t.HttpServer.ServeFileBytes.Read.FailureKind, number> = {
  missing: 404,
  changed: 412,
  cancelled: 499,
  failure: 500,
};

/** Emit one constrained response from lazily supplied bytes. */
export const serveFileBytes: Method = async (input) => {
  const req = input.req;
  const path = input.path;
  const cache = input.cache;
  const read = input.read;
  const method = req.method;

  if (method !== 'GET' && method !== 'HEAD') {
    return empty(405, { allow: 'GET, HEAD' });
  }
  if (req.headers.has('range')) return empty(416);
  if (cache !== 'no-store' || !Is.string(path) || !Is.func(read)) return empty(500);

  let result: ReadResult | undefined;
  try {
    result = readResult(await read());
  } catch {
    return empty(500);
  }

  if (!result) return empty(500);
  if (result.kind !== 'bytes') return empty(FAILURE_STATUS[result.kind]);

  const bytes = result.bytes;
  const headers = responseHeaders({
    'content-length': String(bytes.byteLength),
    'content-type': contentTypeFromPath(path),
  });
  const body = method === 'HEAD' ? null : responseBody(bytes);
  return new Response(body, { status: 200, headers });
};

/**
 * Helpers:
 */
function empty(status: number, extra?: HeadersInit): Response {
  return new Response(null, { status, headers: responseHeaders(extra) });
}

function responseHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  return headers;
}

function responseBody(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (bytes.buffer instanceof ArrayBuffer) {
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  return Uint8Array.from(bytes);
}

function readResult(input: unknown): ReadResult | undefined {
  if (!Is.plainObject(input)) return;

  const keys = Reflect.ownKeys(input);
  if (!keys.every(Is.string)) return;
  const names = keys.map(String).sort();
  const kind = dataProperty(input, 'kind');
  if (!Is.string(kind)) return;

  if (kind === 'bytes') {
    if (!Arr.equal(names, ['bytes', 'kind'])) return;
    const bytes = dataProperty(input, 'bytes');
    if (!Is.uint8Array(bytes)) return;
    return { kind, bytes };
  }

  if (!Arr.equal(names, ['kind'])) return;
  if (kind === 'missing' || kind === 'changed' || kind === 'cancelled' || kind === 'failure') {
    return { kind };
  }
}

function dataProperty(input: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor && Obj.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}
