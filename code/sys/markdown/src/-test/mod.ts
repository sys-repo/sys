export { EsmAssert } from '@sys/esm/testing';
export { Testing, c, describe, expect, expectError, expectTypeOf, it } from '@sys/testing/server';
export * from '../common.ts';

export function packageRootEntry() {
  return new URL('../mod.ts', import.meta.url).pathname;
}
