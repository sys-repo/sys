/**
 * Polyfilles for when RXJS assumes it may be in the browser,
 * but Deno does not have the environment it requires.
 */

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    // Schedule the callback immediately via a microtask.
    const id = Date.now() + Math.random();
    Promise.resolve().then(() => callback(Date.now()));
    return id;
  };
}

if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = (_handle: number): void => {
    // no-op.
  };
}
