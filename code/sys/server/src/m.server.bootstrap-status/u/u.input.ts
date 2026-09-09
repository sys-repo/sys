import { Is, Num } from '../common.ts';

export type PreparedInput = {
  readonly pages: ReadonlyMap<string, Uint8Array<ArrayBuffer>>;
  readonly resolve: () => unknown;
};

type AdmittedPage = {
  readonly key: string;
  readonly bytes: Uint8Array;
};

const FORBIDDEN_INPUT_KEYS = ['until', 'token', 'capability'] as const;
const NativePromisePrototype = Promise.prototype;
const NativeUint8Array = Uint8Array;
const NativeUint8ArrayPrototype = NativeUint8Array.prototype;
const arrayPrototype = Array.prototype;
const objectPrototype = Object.prototype;
const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const TYPED_ARRAY_PROTOTYPE = getPrototypeOf(NativeUint8ArrayPrototype);
const BYTE_LENGTH_GETTER = getOwnPropertyDescriptor(TYPED_ARRAY_PROTOTYPE, 'byteLength')?.get;
const BUFFER_GETTER = getOwnPropertyDescriptor(TYPED_ARRAY_PROTOTYPE, 'buffer')?.get;

export const INPUT_LIMITS = freeze({
  pages: 16,
  keyChars: 128,
  pageBytes: 256 * 1024,
  totalBytes: 1024 * 1024,
});

/** Copy and validate the complete public startup authority before asynchronous work. */
export function snapshotInput(input: unknown): PreparedInput | undefined {
  if (!isPlainRecord(input) || hasAnyOwn(input, FORBIDDEN_INPUT_KEYS)) return;

  const pagesValue = ownData(input, 'pages');
  const resolveValue = ownData(input, 'resolve');
  if (!pagesValue.ok || !resolveValue.ok || !Is.func(resolveValue.value)) return;
  const resolve = resolveValue.value;
  if (Is.Native.proxy(resolve)) return;

  const pages = snapshotPages(pagesValue.value);
  if (!pages) return;

  return freeze({
    pages,
    resolve: () => resolve(),
  });
}

/** Snapshot one synchronous resolver projection without invoking owned accessors. */
export function snapshotProjection(
  input: unknown,
):
  | Readonly<{ kind: 'page'; key: string }>
  | Readonly<{ kind: 'redirect'; origin: string }>
  | undefined {
  if (Is.object(input) && Is.Native.proxy(input)) return;
  if (isNativePromise(input)) {
    void drainPromise(input);
    return;
  }

  if (!isPlainRecord(input)) return;
  const kind = ownData(input, 'kind');
  if (!kind.ok) return;

  if (kind.value === 'page') {
    const key = ownData(input, 'key');
    return key.ok && Is.string(key.value) ? { kind: 'page', key: key.value } : undefined;
  }
  if (kind.value === 'redirect') {
    const origin = ownData(input, 'origin');
    return origin.ok && Is.string(origin.value)
      ? { kind: 'redirect', origin: origin.value }
      : undefined;
  }
}

function snapshotPages(input: unknown): ReadonlyMap<string, Uint8Array<ArrayBuffer>> | undefined {
  if (!Is.object(input) || Is.Native.proxy(input)) return;
  try {
    if (!Is.array(input)) return;
    if (
      getPrototypeOf(input) !== arrayPrototype ||
      input.length === 0 ||
      input.length > INPUT_LIMITS.pages
    ) {
      return;
    }

    let totalBytes = 0;
    const pages = new Map<string, Uint8Array<ArrayBuffer>>();
    for (let index = 0; index < input.length; index++) {
      const descriptor = getOwnPropertyDescriptor(input, String(index));
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) return;
      const page = admitPage(descriptor.value);
      if (!page || pages.has(page.key)) return;
      const bytes = copyBytes(page.bytes, INPUT_LIMITS.totalBytes - totalBytes);
      if (!bytes) return;
      totalBytes += bytes.byteLength;
      pages.set(page.key, bytes);
    }
    return pages;
  } catch {
    return;
  }
}

function admitPage(input: unknown): AdmittedPage | undefined {
  if (!isPlainRecord(input)) return;
  const key = ownData(input, 'key');
  const bytes = ownData(input, 'bytes');
  if (
    !key.ok ||
    !Is.string(key.value) ||
    key.value.length === 0 ||
    key.value.length > INPUT_LIMITS.keyChars ||
    !bytes.ok ||
    !isUint8Array(bytes.value)
  ) {
    return;
  }
  return { key: key.value, bytes: bytes.value };
}

function isNativePromise(input: unknown): input is Promise<unknown> {
  if (!Is.object(input) || Is.Native.proxy(input) || !Is.Native.promise(input)) return false;
  try {
    return getPrototypeOf(input) === NativePromisePrototype;
  } catch {
    return false;
  }
}

async function drainPromise(input: Promise<unknown>): Promise<void> {
  try {
    await input;
  } catch {
    // Asynchronous resolver projections are invalid, but their rejection remains owned.
  }
}

function isPlainRecord(input: unknown): input is object {
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
  try {
    return getPrototypeOf(input) === objectPrototype;
  } catch {
    return false;
  }
}

function ownData(
  input: object,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    const property = getOwnPropertyDescriptor(input, key);
    return property?.enumerable && 'value' in property
      ? { ok: true, value: property.value }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}

function hasAnyOwn(input: object, keys: readonly PropertyKey[]): boolean {
  try {
    return keys.some((key) => getOwnPropertyDescriptor(input, key) !== undefined);
  } catch {
    return true;
  }
}

function isUint8Array(input: unknown): input is Uint8Array {
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
  try {
    return Is.Native.uint8Array(input) && getPrototypeOf(input) === NativeUint8ArrayPrototype;
  } catch {
    return false;
  }
}

function copyBytes(input: Uint8Array, remainingBytes: number): Uint8Array<ArrayBuffer> | undefined {
  if (!BUFFER_GETTER) return;
  try {
    const buffer = apply(BUFFER_GETTER, input, []);
    if (Is.Native.sharedArrayBuffer(buffer)) return;

    const admittedLength = byteLengthOf(input);
    if (
      admittedLength === undefined ||
      admittedLength > INPUT_LIMITS.pageBytes ||
      admittedLength > remainingBytes
    ) {
      return;
    }

    const copied = new NativeUint8Array(input);
    return copied.byteLength === admittedLength ? copied : undefined;
  } catch {
    return;
  }
}

function byteLengthOf(input: Uint8Array): number | undefined {
  if (!BYTE_LENGTH_GETTER) return;
  try {
    const value = apply(BYTE_LENGTH_GETTER, input, []);
    return Num.Is.safeInt(value) && value >= 0 ? value : undefined;
  } catch {
    return;
  }
}
