/**
 * Hook: delays a value update until it remains stable
 * for the given time-window.
 */
export type UseDebouncedValue = <T>(value: T, ms?: number) => T;
