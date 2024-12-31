/**
 * @module
 * Testing tools.
 *
 * @example
 * A simple unit-test file, named: `-<Subject>.test.ts`.
 *
 * The test runner picks up on the `*.test.ts` pattern, and the
 * `-<Subject>.` name prefix highlights it both visually as a "unit test" in
 * the folder as well as ensuring the tests are naturally grouped together
 * within the folder structure.
 *
 * ```ts
 * import { Testing, describe, expect, it } from '@std/sys';
 *
 * describe('My Suite', () => {
 *   it('does something', async () => {
 *     await Testing.wait(300);
 *     expect(123).to.eql(123);
 *   });
 * });
 * ```
 */
export { describe, expect, expectError, it } from '@sys/std/testing';

export { rx, slug, Time } from '@sys/std';
export { Testing } from '@sys/std/testing/server';
export { Fs, Path } from '../common.ts';
