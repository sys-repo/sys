import { Arr, Is, Obj, type t } from './common.ts';

type ReadResult = t.HttpServer.ServeFileBytes.Read.Result;

/** Snapshot the exact admitted fields without invoking caller-owned accessors. */
export function argsSnapshot(input: unknown): t.HttpServer.ServeFileBytes.Args | undefined {
  if (!Is.object(input)) return;
  if (!hasExactNames(input, ['cache', 'path', 'read', 'req'])) return;

  const req = dataProperty(input, 'req');
  const path = dataProperty(input, 'path');
  const cache = dataProperty(input, 'cache');
  const read = dataProperty(input, 'read');
  if (!Is.string(path) || cache !== 'no-store' || !Is.func(read)) return;
  return {
    req: req as Request,
    path,
    cache,
    read: read as t.HttpServer.ServeFileBytes.Read.Method,
  };
}

/** Read method and Range policy through the native request/header prototypes. */
export function requestSnapshot(input: unknown): { method: string; hasRange: boolean } | undefined {
  if (!Is.object(input) || Object.getPrototypeOf(input) !== Request.prototype) return;

  const method = prototypeGetter(Request.prototype, 'method', input);
  const headers = prototypeGetter(Request.prototype, 'headers', input);
  if (!Is.string(method) || !Is.object(headers)) return;
  if (Object.getPrototypeOf(headers) !== Headers.prototype) return;

  const has = Headers.prototype.has;
  return { method, hasRange: Reflect.apply(has, headers, ['range']) };
}

/** Validate the exact read-result shape without invoking accessors. */
export function readResult(input: unknown): ReadResult | undefined {
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

/**
 * Helpers:
 */
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
