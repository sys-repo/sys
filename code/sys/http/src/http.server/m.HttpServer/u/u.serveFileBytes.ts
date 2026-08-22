import { Arr } from '@sys/std/arr';
import { Is } from '@sys/std/is';
import { Obj } from '@sys/std/obj';
import type { FileBytes } from '../../m.FileBytes/t.ts';
import { contentTypeFromPath } from './u.contentTypeFromPath.ts';

type ReadResult = FileBytes.Read.Result;

const FAILURE_STATUS: Record<FileBytes.Read.FailureKind, number> = {
  missing: 404,
  changed: 412,
  cancelled: 499,
  failure: 500,
};

/** Emit one constrained response from lazily supplied bytes. */
export async function serveFileBytes(args: FileBytes.Args): Promise<Response> {
  try {
    return await serve(args);
  } catch {
    return empty(500);
  }
}

async function serve(input: unknown): Promise<Response> {
  const args = argsSnapshot(input);
  if (!args) return empty(500);

  const request = requestSnapshot(args.req);
  if (!request) return empty(500);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return empty(405, { allow: 'GET, HEAD' });
  }
  if (request.hasRange) return empty(416);

  const path = args.path;
  const read = args.read;
  const result = readResult(await read());
  if (!result) return empty(500);
  if (result.kind !== 'bytes') return empty(FAILURE_STATUS[result.kind]);

  const bytes = copyBytes(result.bytes);
  if (!bytes) return empty(500);

  const headers = responseHeaders({
    'content-length': String(bytes.byteLength),
    'content-type': contentTypeFromPath(path),
  });
  const body = request.method === 'HEAD' ? null : bytes;
  return new Response(body, { status: 200, headers });
}

function argsSnapshot(input: unknown): FileBytes.Args | undefined {
  if (!Is.object(input)) return;
  if (!hasExactNames(input, ['cache', 'path', 'read', 'req'])) return;

  const req = dataProperty(input, 'req');
  const path = dataProperty(input, 'path');
  const cache = dataProperty(input, 'cache');
  const read = dataProperty(input, 'read');
  if (!Is.string(path) || cache !== 'no-store' || !Is.func(read)) return;
  return { req: req as Request, path, cache, read: read as FileBytes.Read.Method };
}

function requestSnapshot(input: unknown): { method: string; hasRange: boolean } | undefined {
  if (!Is.object(input) || Object.getPrototypeOf(input) !== Request.prototype) return;

  const method = prototypeGetter(Request.prototype, 'method', input);
  const headers = prototypeGetter(Request.prototype, 'headers', input);
  if (
    !Is.string(method) || !Is.object(headers) ||
    Object.getPrototypeOf(headers) !== Headers.prototype
  ) {
    return;
  }

  const has = Headers.prototype.has;
  return { method, hasRange: Reflect.apply(has, headers, ['range']) };
}

function readResult(input: unknown): ReadResult | undefined {
  if (!Is.object(input)) return;

  const names = namesOf(input);
  if (!names) return;
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

function copyBytes(input: Uint8Array): Uint8Array<ArrayBuffer> | undefined {
  return Uint8Array.from(input);
}

function hasExactNames(input: object, expected: readonly string[]): boolean {
  const names = namesOf(input);
  return !!names && Arr.equal(names, expected);
}

function namesOf(input: object): string[] | undefined {
  const keys = Reflect.ownKeys(input);
  if (!keys.every(Is.string)) return;
  return keys.map(String).sort();
}

function prototypeGetter(prototype: object, key: string, receiver: object): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
  const get = descriptor && Obj.hasOwn(descriptor, 'get') ? descriptor.get : undefined;
  return Is.func(get) ? Reflect.apply(get, receiver, []) : undefined;
}

function dataProperty(input: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor && Obj.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}

function empty(status: number, extra?: HeadersInit): Response {
  return new Response(null, { status, headers: responseHeaders(extra) });
}

function responseHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  return headers;
}
