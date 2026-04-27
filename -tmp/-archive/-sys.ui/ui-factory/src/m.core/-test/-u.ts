import { type t } from '../common.ts';

/** Minimal test "module" shape used by core tests. */
export type TestModule = {
  default: (props: unknown) => { name: string; props: unknown };
};

/**
 * Test helpers for UI views:
 */
const View = {
  /**
   * Silent stub: returns a callable default export with predictable output.
   */
  stub(name: string): TestModule {
    return { default: (props: unknown) => ({ name, props }) };
  },
} as const;

/**
 * Test helpers for factory Registrations.
 */
export const Reg = {
  /**
   * Registration helper.
   * - Back-compat: default `slots` = [] (matches current tests).
   * - When writing slot-related tests, pass `slots` explicitly.
   */
  make<Id extends string, Slot extends string = string>(
    id: Id,
    slots: readonly Slot[] = [],
  ): t.Registration<Id, Slot, TestModule> {
    return {
      spec: { id, slots },
      load: async () => View.stub(id),
    };
  },

  /**
   * Wrap a registration so each `load()` increments a counter.
   * Useful for asserting memoization (eg. loads happen once per Id).
   */
  counter<Id extends string, Slot extends string>(regIn: t.Registration<Id, Slot, TestModule>) {
    let count = 0;
    const reg: t.Registration<Id, Slot, TestModule> = {
      ...regIn,
      async load() {
        count += 1;
        return regIn.load();
      },
    };
    return {
      reg,
      get count() {
        return count;
      },
    };
  },
} as const;

/**
 * Adapter-agnostic test helpers for the tiny factory "core".
 */
export const TestCore = { View, Reg } as const;
