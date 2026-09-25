/** Override only Date.now; native Date values and local-zone formatting remain real. */
export function wallClock(initial = 1_700_000_000_000) {
  const descriptor = Object.getOwnPropertyDescriptor(Date, 'now')!;
  let timestamp = initial;
  Object.defineProperty(Date, 'now', { ...descriptor, value: () => timestamp });
  return {
    get now() {
      return timestamp;
    },
    set(value: number) {
      timestamp = value;
    },
    [Symbol.dispose]() {
      Object.defineProperty(Date, 'now', descriptor);
    },
  };
}
