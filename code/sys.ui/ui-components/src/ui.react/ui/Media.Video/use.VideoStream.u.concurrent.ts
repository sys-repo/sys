// Single-flight: ensure only one acquire runs at a time.
let inflight: Promise<void> = Promise.resolve();

export async function singleFlight<T>(fn: () => Promise<T>): Promise<T> {
  let resolvePrev: (() => void) | undefined;
  const prev = inflight.finally(() => {});
  inflight = new Promise<void>((r) => (resolvePrev = r));
  await prev; // wait for previous flight to finish

  try {
    return await fn();
  } finally {
    resolvePrev?.();
  }
}
