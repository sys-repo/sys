import { Cli, Fs, Is, StartGuiIntrinsic, type t } from '../common.ts';

import { createOwnedError } from '../u.error.ts';
import { captureFileHref, captureUrl, stableNativeUrl } from '../u.url.ts';
import type { CapturedRootLink, ScreenSize } from './t.ts';

const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const isAbsolutePath = Fs.Path.Is.absolute;
const NativeMath = Math;
const NativeNumber = Number;
const mathFloor = NativeMath.floor;
const mathMax = NativeMath.max;
const numberIsFinite = NativeNumber.isFinite;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;
const ROOT_LINKS = StartGuiIntrinsic.createWeakSet<object>();
const stringTrim = String.prototype.trim;
const INVALID_DATA = Symbol('start:gui.invalid-screen-data');
const MAX_SCREEN_DIMENSION = 65_535;

/** Capture one exact development root and its stable file-link authority. */
export function captureRootLink(input: unknown): CapturedRootLink | undefined {
  const text = captureDisplayRoot(input);
  if (!text) return;
  try {
    const href = captureFileHref(text);
    if (!href) return;
    const url = stableNativeUrl(href);
    if (!url) return;
    const root = freeze({ text, url });
    StartGuiIntrinsic.weakSetAdd(ROOT_LINKS, root);
    return root;
  } catch {
    return;
  }
}

/** Admit only a root captured by this owner, or capture a raw root at this boundary. */
export function capturedRootLink(input: unknown): CapturedRootLink | undefined {
  if (Is.object(input) && StartGuiIntrinsic.weakSetHas(ROOT_LINKS, input)) {
    return input as CapturedRootLink;
  }
  return captureRootLink(input);
}

/** Admit one credential-free HTTP(S) manifest URL. */
export function captureManifestUrl(input: unknown): t.StringUrl | undefined {
  if (!Is.string(input)) return;
  const url = captureUrl(input);
  if (
    !url || (url.protocol !== 'http:' && url.protocol !== 'https:') || url.username ||
    url.password || url.search || url.hash
  ) return;
  return url.href;
}

/** Capture one service URL into stable presentation parts. */
export function captureServiceUrl(input: t.StringUrl): t.Cli.Fmt.ServiceUrl.Part | undefined {
  const url = captureUrl(input);
  if (!url) return;
  const hostname = Cli.Fmt.ServiceUrl.displayHostname(url.hostname);
  const host = url.port ? `${hostname}:${url.port}` : hostname;
  const origin = `${url.protocol}//${host}`;
  const suffix = `${url.pathname}${url.search}${url.hash}` || '/';
  return freeze({
    ok: true,
    href: url.href,
    origin,
    suffix,
    display: `${origin}${suffix}`,
    ...(url.port ? { port: url.port } : {}),
    highlightOrigin: true,
  });
}

/** Admit an exact bounded viewport snapshot through captured presentation authority. */
export function normalizeSize(size: unknown): ScreenSize {
  if (!Cli.Fmt.isReady()) {
    throw createOwnedError('start:gui screen presentation authority unavailable.');
  }
  if (!isDirectObject(size)) throw createOwnedError('start:gui screen failed.');

  let keys: readonly PropertyKey[];
  try {
    keys = ownKeys(size);
  } catch {
    throw createOwnedError('start:gui screen failed.');
  }
  if (keys.length !== 2) throw createOwnedError('start:gui screen failed.');

  const width = ownEnumerableData(size, 'width');
  const height = ownEnumerableData(size, 'height');
  if (!isScreenDimension(width) || !isScreenDimension(height)) {
    throw createOwnedError('start:gui screen failed.');
  }
  return freeze({ width: canonicalDimension(width), height: canonicalDimension(height) });
}

/** Snapshot only the post-resize viewport from one exact size-change event. */
export function snapshotResizeAfter(event: unknown): unknown {
  if (!isDirectObject(event)) return;
  let keys: readonly PropertyKey[];
  try {
    keys = ownKeys(event);
  } catch {
    return;
  }
  if (keys.length !== 3) return;
  const kind = ownEnumerableData(event, 'kind');
  const before = ownEnumerableData(event, 'before');
  const after = ownEnumerableData(event, 'after');
  if (kind !== 'size:changed' || before === INVALID_DATA || after === INVALID_DATA) return;
  return after;
}

/** Capture one descriptor-backed value without invoking accessors or Proxy traps. */
export function descriptorValue(input: unknown, key: PropertyKey): unknown {
  if (!Is.object(input) || Is.Native.proxy(input)) return;
  let target: object | null = input;
  try {
    // Bounded positional traversal avoids attacker-controlled iteration.
    for (let depth = 0; target && depth < 8; depth += 1) {
      if (Is.Native.proxy(target)) return;
      const descriptor = getOwnPropertyDescriptor(target, key);
      if (descriptor) return 'value' in descriptor ? descriptor.value : undefined;
      target = getPrototypeOf(target);
    }
  } catch {
    return;
  }
}

/** Capture one descriptor-backed method without invoking accessors or Proxy traps. */
export function descriptorMethod(
  input: unknown,
  key: PropertyKey,
): ((...args: never[]) => unknown) | undefined {
  const value = descriptorValue(input, key);
  return Is.func(value) && !Is.Native.proxy(value)
    ? value as (...args: never[]) => unknown
    : undefined;
}

export function numericMax(left: number, right: number): number {
  return apply(mathMax, NativeMath, [left, right]) as number;
}

function captureDisplayRoot(input: unknown): t.StringAbsoluteDir | undefined {
  if (
    !Is.string(input) || apply(stringTrim, input, []) !== input ||
    !apply(isAbsolutePath, undefined, [input])
  ) return;
  // Positional scanning is required to consume UTF-16 surrogate pairs atomically.
  for (let index = 0; index < input.length; index += 1) {
    const first = StartGuiIntrinsic.stringCharCodeAt(input, index);
    if (first <= 0x1f || (first >= 0x7f && first <= 0x9f)) return;
    if (first === 0x2028 || first === 0x2029) return;

    let codePoint = first;
    if (first >= 0xd800 && first <= 0xdbff) {
      if (index + 1 >= input.length) return;
      const second = StartGuiIntrinsic.stringCharCodeAt(input, index + 1);
      if (second < 0xdc00 || second > 0xdfff) return;
      codePoint = 0x10000 + ((first - 0xd800) * 0x400) + (second - 0xdc00);
      index += 1;
    } else if (first >= 0xdc00 && first <= 0xdfff) {
      return;
    }
    if (isUnicodeFormatControl(codePoint)) return;
  }
  return input as t.StringAbsoluteDir;
}

function isUnicodeFormatControl(code: number): boolean {
  return code === 0x00ad ||
    (code >= 0x0600 && code <= 0x0605) || code === 0x061c || code === 0x06dd ||
    code === 0x070f || (code >= 0x0890 && code <= 0x0891) || code === 0x08e2 ||
    code === 0x180e || (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) || (code >= 0x2060 && code <= 0x2064) ||
    (code >= 0x2066 && code <= 0x206f) || code === 0xfeff ||
    (code >= 0xfff9 && code <= 0xfffb) || code === 0x110bd || code === 0x110cd ||
    (code >= 0x13430 && code <= 0x1343f) || (code >= 0x1bca0 && code <= 0x1bca3) ||
    (code >= 0x1d173 && code <= 0x1d17a) || code === 0xe0001 ||
    (code >= 0xe0020 && code <= 0xe007f);
}

function isDirectObject(input: unknown): input is object {
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
  try {
    return getPrototypeOf(input) === objectPrototype;
  } catch {
    return false;
  }
}

function ownEnumerableData(input: object, key: PropertyKey): unknown {
  try {
    const descriptor = getOwnPropertyDescriptor(input, key);
    return descriptor?.enumerable === true && 'value' in descriptor
      ? descriptor.value
      : INVALID_DATA;
  } catch {
    return INVALID_DATA;
  }
}

function isScreenDimension(input: unknown): input is number {
  return Is.number(input) && numericIsFinite(input) && input >= 0 &&
    input <= MAX_SCREEN_DIMENSION && numericFloor(input) === input;
}

function canonicalDimension(input: number): number {
  return input === 0 ? 0 : input;
}

function numericFloor(value: number): number {
  return apply(mathFloor, NativeMath, [value]) as number;
}

function numericIsFinite(value: number): boolean {
  return apply(numberIsFinite, NativeNumber, [value]) as boolean;
}
