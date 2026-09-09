import { expect } from '../../../-test.ts';

/** Current own-property descriptor for the Fetch global. */
export function fetchDescriptor() {
  return Object.getOwnPropertyDescriptor(globalThis, 'fetch');
}

/** Restore a captured Fetch global descriptor exactly. */
export function restoreFetch(descriptor: PropertyDescriptor | undefined) {
  if (descriptor) {
    Object.defineProperty(globalThis, 'fetch', descriptor);
  } else if (!Reflect.deleteProperty(globalThis, 'fetch')) {
    throw new TypeError('Failed to restore the Fetch global after a test.');
  }
}

/** Assert that the current Fetch global descriptor matches the captured descriptor. */
export function expectFetchDescriptor(expected: PropertyDescriptor | undefined) {
  expect(fetchDescriptor()).to.eql(expected);
}
