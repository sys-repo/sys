/**
 * @module
 * Testing tools.
 *
 * @example
 * A simple unit-test file, named: `<subject>.-unit.test.ts`.
 *
 * The test runner picks up on the `*.test.ts` pattern, and the
 * `.-unit.` prefix highlights it both visually as a "unit test" in
 * the folder, as well as explicitly calling out the "type" of tests
 * contained withhin the file:
 *
 * - `*.-unit.test.ts`
 * - `*.-int.test.ts` ← "integration" test.
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
export { describe, expect, it } from '@sys/std/testing';

export { Time, rx, slug } from '@sys/std';
export { Testing } from '@sys/std/testing/httpserver';
export { Fs, Path } from '../m.Fs/mod.ts';
