import { Fs, Is, type t } from './common.ts';

export type CapturedUrl = Readonly<{
  href: t.StringUrl;
  origin: t.StringUrl;
  protocol: string;
  hostname: string;
  host: string;
  port: string;
  username: string;
  password: string;
  pathname: string;
  search: string;
  hash: string;
}>;

type UrlGetter = ((this: URL) => unknown) | undefined;

const NativeURL = URL;
const NativeError = Error;
const apply = Reflect.apply;
const pathFromFileUrl = Fs.Path.fromFileUrl;
const pathToFileUrl = Fs.Path.toFileUrl;
const defineProperty = Object.defineProperty;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const prototype = NativeURL.prototype;
const descriptors = freeze({
  href: snapshotDescriptor('href'),
  origin: snapshotDescriptor('origin'),
  protocol: snapshotDescriptor('protocol'),
  hostname: snapshotDescriptor('hostname'),
  host: snapshotDescriptor('host'),
  port: snapshotDescriptor('port'),
  username: snapshotDescriptor('username'),
  password: snapshotDescriptor('password'),
  pathname: snapshotDescriptor('pathname'),
  search: snapshotDescriptor('search'),
  hash: snapshotDescriptor('hash'),
});
const getters = freeze({
  href: descriptors.href?.get,
  origin: descriptors.origin?.get,
  protocol: descriptors.protocol?.get,
  hostname: descriptors.hostname?.get,
  host: descriptors.host?.get,
  port: descriptors.port?.get,
  username: descriptors.username?.get,
  password: descriptors.password?.get,
  pathname: descriptors.pathname?.get,
  search: descriptors.search?.get,
  hash: descriptors.hash?.get,
});

/** Parse and copy one URL without later ambient constructor or prototype authority. */
export function captureUrl(input: string): CapturedUrl | undefined {
  if (!isUrlSubstrateReady()) return;
  try {
    return captureNativeUrl(new NativeURL(input));
  } catch {
    return;
  }
}

/** Copy one native URL through module-captured getters after substrate verification. */
export function captureNativeUrl(url: URL): CapturedUrl | undefined {
  if (!isUrlSubstrateReady()) return;
  try {
    const href = readString(getters.href, url);
    const origin = readString(getters.origin, url);
    const protocol = readString(getters.protocol, url);
    const hostname = readString(getters.hostname, url);
    const host = readString(getters.host, url);
    const port = readString(getters.port, url);
    const username = readString(getters.username, url);
    const password = readString(getters.password, url);
    const pathname = readString(getters.pathname, url);
    const search = readString(getters.search, url);
    const hash = readString(getters.hash, url);
    return freeze({
      href: href as t.StringUrl,
      origin: origin as t.StringUrl,
      protocol,
      hostname,
      host,
      port,
      username,
      password,
      pathname,
      search,
      hash,
    });
  } catch {
    return;
  }
}

/** Convert one exact absolute path into a copied file-URL href. */
export function captureFileHref(input: t.StringAbsoluteDir): t.StringUrl | undefined {
  try {
    const native = apply(pathToFileUrl, undefined, [input]) as URL;
    const captured = captureNativeUrl(native);
    if (!captured || captured.protocol !== 'file:' || captured.search || captured.hash) return;
    const roundTrip = apply(pathFromFileUrl, undefined, [captured.href]);
    if (roundTrip !== input) return;
    return captured.href;
  } catch {
    return;
  }
}

/** Build one URL whose presentation href no longer dispatches through its mutable prototype. */
export function stableNativeUrl(input: string): URL | undefined {
  if (!isUrlSubstrateReady()) return;
  try {
    const url = new NativeURL(input);
    const href = read(getters.href, url);
    if (!Is.string(href)) return;
    defineProperty(url, 'href', {
      configurable: false,
      enumerable: false,
      value: href,
      writable: false,
    });
    return freeze(url);
  } catch {
    return;
  }
}

function snapshotDescriptor(key: string): Readonly<PropertyDescriptor> | undefined {
  const descriptor = getOwnPropertyDescriptor(prototype, key);
  if (!descriptor) return;
  return freeze({
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set: descriptor.set,
  });
}

function isUrlSubstrateReady(): boolean {
  try {
    return sameDescriptor('href', descriptors.href) &&
      sameDescriptor('origin', descriptors.origin) &&
      sameDescriptor('protocol', descriptors.protocol) &&
      sameDescriptor('hostname', descriptors.hostname) &&
      sameDescriptor('host', descriptors.host) &&
      sameDescriptor('port', descriptors.port) &&
      sameDescriptor('username', descriptors.username) &&
      sameDescriptor('password', descriptors.password) &&
      sameDescriptor('pathname', descriptors.pathname) &&
      sameDescriptor('search', descriptors.search) &&
      sameDescriptor('hash', descriptors.hash);
  } catch {
    return false;
  }
}

function sameDescriptor(
  key: string,
  expected: Readonly<PropertyDescriptor> | undefined,
): boolean {
  if (!expected) return false;
  const actual = getOwnPropertyDescriptor(prototype, key);
  return actual !== undefined && actual.configurable === expected.configurable &&
    actual.enumerable === expected.enumerable && actual.get === expected.get &&
    actual.set === expected.set;
}

function read(getter: UrlGetter, url: URL): unknown {
  if (!getter) throw new NativeError('Native URL getter unavailable.');
  return apply(getter, url, []);
}

function readString(getter: UrlGetter, url: URL): string {
  const value = read(getter, url);
  if (!Is.string(value)) throw new NativeError('Native URL value unavailable.');
  return value;
}
