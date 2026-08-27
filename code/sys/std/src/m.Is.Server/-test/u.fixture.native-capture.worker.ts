import { types as NodeTypes } from 'node:util';
import { Is } from '../mod.ts';

const KEYS = [
  'isProxy',
  'isPromise',
  'isNativeError',
  'isUint8Array',
  'isSharedArrayBuffer',
] as const;

type Reply =
  | { ok: true; value: ReturnType<typeof run> }
  | { ok: false; error: string };

self.onmessage = () => {
  let reply: Reply;
  try {
    reply = { ok: true, value: run() };
  } catch (cause) {
    reply = {
      ok: false,
      error: cause instanceof Error ? cause.stack ?? cause.message : String(cause),
    };
  }
  self.postMessage(reply);
};

function run() {
  const descriptors = KEYS.map((key) => requiredDescriptor(NodeTypes, key));
  let poisonCalls = 0;
  let namespaceClassifies = false;

  try {
    KEYS.forEach((key, index) => {
      const descriptor = descriptors[index];
      Object.defineProperty(NodeTypes, key, {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        writable: true,
        value: () => {
          poisonCalls += 1;
          return false;
        },
      });
    });

    const proxy = new Proxy({}, {});
    const promise = Promise.resolve();
    const error = new Error('capture proof');
    const bytes = new Uint8Array();
    const shared = new SharedArrayBuffer();

    namespaceClassifies = [
      Is.Native.proxy(proxy),
      Is.Native.promise(promise),
      Is.Native.error(error),
      Is.Native.uint8Array(bytes),
      Is.Native.sharedArrayBuffer(shared),
    ].every(Boolean);
  } finally {
    KEYS.forEach((key, index) => Object.defineProperty(NodeTypes, key, descriptors[index]));
  }

  return {
    descriptorsRestored: KEYS.every((key, index) =>
      sameDescriptor(Object.getOwnPropertyDescriptor(NodeTypes, key), descriptors[index])
    ),
    namespaceClassifies,
    poisonCalls,
  };
}

function requiredDescriptor(target: object, key: PropertyKey): PropertyDescriptor {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (!descriptor) throw new Error(`Missing descriptor: ${String(key)}`);
  return descriptor;
}

function sameDescriptor(
  actual: PropertyDescriptor | undefined,
  expected: PropertyDescriptor | undefined,
): boolean {
  if (!actual || !expected) return actual === expected;
  return actual.configurable === expected.configurable &&
    actual.enumerable === expected.enumerable &&
    actual.get === expected.get &&
    actual.set === expected.set &&
    actual.value === expected.value &&
    actual.writable === expected.writable;
}
