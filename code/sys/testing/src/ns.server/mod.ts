/**
 * @module
 * Server-side testing tools, including HTTP servers and file-system helpers.
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
 * import { Testing, describe, expect, it } from '@sys/testing/server';
 *
 * describe('My Suite', () => {
 *   it('does something', async () => {
 *     await Testing.wait(300);
 *     expect(123).to.eql(123);
 *   });
 * });
 */
export * from './common.ts';
export { DomMock } from './m.DomMock/mod.ts';
export { Testing } from './m.Testing/mod.ts';
