/**
 * @module
 * Standard testing helpers (surfaced from "@sys/std").
 *
 * @example
 * Import test helpers.
 *
 * ```ts
 * import { expect, describe, it } from '@sys/testing'
 * import { expect, describe, it } from '@sys/testing/std'
 * ```
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
 */
export * from '@sys/std/testing';
