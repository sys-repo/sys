/** One named pause in a test trace; no queue, timer, retry, transport, or cancellation semantics. */
export function deliveryCheckpoint() {
  const arrived = Promise.withResolvers<void>();
  const released = Promise.withResolvers<void>();
  return {
    arrived: arrived.promise,
    async hold() {
      arrived.resolve();
      await released.promise;
    },
    release: () => released.resolve(),
    [Symbol.dispose]: () => released.resolve(),
  };
}
