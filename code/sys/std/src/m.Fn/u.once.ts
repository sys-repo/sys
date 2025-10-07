export function onceOnly<A extends readonly unknown[], R>(fn: (...a: A) => R) {
  let done = false;
  let value: R | undefined;

  return (...args: A): R => {
    if (done) return value as R;

    // Run once semantics:
    try {
      const out = fn(...args);
      // If it's a Promise, cache immediately so concurrent calls share it.
      if (out && typeof (out as any).then === 'function') {
        done = true;
        value = out as R;
        return value;
      }
      // For sync success, mark done after we have the value.
      done = true;
      value = out;
      return value as R;
    } catch (err) {
      // Do NOT mark done on sync throw: allow a future retry.
      throw err;
    }
  };
}
