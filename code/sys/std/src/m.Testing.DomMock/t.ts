import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.fake.ts';
export type * from './t.keyboard.ts';

export type TestHook = <T>(fn: (this: T) => void | Promise<void>) => void;

/**
 * Represents the overall DOM Mock Library.
 */
export type DomMockLib = {
  /** DOM related test fakes. */
  readonly Fake: t.DomMockFakeLib;

  /** Keyboard event utilities. */
  readonly Keyboard: t.DomMockKeyboardLib;

  /** Flag indicating if the environment is currently poly-filled with the dom-mocks. */
  readonly isPolyfilled: boolean;

  /** Ensure `globalThis` is polyfilled with window/document. */
  polyfill(options?: { url?: string }): void;

  /** Returns the `globalThis` to it's original state. */
  unpolyfill(): void;

  /**
   * Registers DomMock lifecycle with the test runner.
   *
   * Usage:
   *   DomMock.init(beforeAll, afterAll);
   *
   * Notes:
   * - Keeps setup/teardown explicit at the call site.
   * - Supports async hooks (Promise-returning) and runner-provided `this` context.
   */
  init(before: TestHook, after: TestHook): void;
};
