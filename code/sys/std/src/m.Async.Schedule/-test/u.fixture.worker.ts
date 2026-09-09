export type FixtureReply<T> = { ok: true; value: T } | { ok: false; error: string };

export async function runWorkerFixture<T>(
  url: URL,
  label: string,
  message?: unknown,
): Promise<T> {
  const worker = new Worker(url, { type: 'module' });
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out.`)), 5_000);
      worker.onerror = (event) => {
        event.preventDefault();
        reject(new Error(`${label} failed: ${event.message}`));
      };
      worker.onmessage = (event: MessageEvent<FixtureReply<T>>) => {
        const reply = event.data;
        if (reply.ok) resolve(reply.value);
        else reject(new Error(reply.error));
      };
      worker.postMessage(message);
    });
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    worker.onerror = null;
    worker.onmessage = null;
    worker.terminate();
  }
}

export function requiredDescriptor(target: object, key: PropertyKey): PropertyDescriptor {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (!descriptor) throw new Error(`Missing descriptor: ${String(key)}`);
  return descriptor;
}

export function replaceValue(
  target: object,
  key: PropertyKey,
  original: PropertyDescriptor,
  value: unknown,
): void {
  Object.defineProperty(target, key, {
    configurable: original.configurable,
    enumerable: original.enumerable,
    writable: true,
    value,
  });
}

export function replaceOptionalValue(
  target: object,
  key: PropertyKey,
  original: PropertyDescriptor | undefined,
  value: unknown,
): void {
  Object.defineProperty(target, key, {
    configurable: original?.configurable ?? true,
    enumerable: original?.enumerable ?? true,
    writable: true,
    value,
  });
}

export function restoreDescriptor(
  target: object,
  key: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) Object.defineProperty(target, key, descriptor);
  else Reflect.deleteProperty(target, key);
}

export function sameDescriptor(
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

export function errorText(error: unknown): string {
  return error instanceof Error ? error.stack ?? `${error.name}: ${error.message}` : String(error);
}
