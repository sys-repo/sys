import { expect } from '@sys/testing/server';
import React from 'react';

import { type t } from './common.ts';

/**
 * Ensure the factory preserves the given slots for a given id.
 */
export const expectSlots = <I extends string, S extends string>(
  f: t.FactoryWithSlots<I, S>,
  id: I,
  slots: readonly S[],
) => expect((f.specs[id] as any).spec.slots).to.eql(slots);

/**
 * Test helpers for UI views:
 */
export const TestView = {
  /**
   * Silent stub: renders a React element with testable attributes.
   */
  stub(name: string): t.LazyViewModule {
    const Comp: React.FC<unknown> = (props) => (
      <div data-stub-view={name} data-props={JSON.stringify(props)} />
    );
    (Comp as any).displayName = name;
    return { default: Comp };
  },
} as const;

/**
 * Test helpers for factory Registrations.
 */
export const TestReg = {
  /**
   * Registration helper.
   * - Back-compat: default `slots` = [] (matches your current tests).
   * - When writing slot-related tests, pass `slots` explicitly.
   */
  make<Id extends string, Slot extends string = string>(
    id: Id,
    slots: Slot[] = [],
  ): t.Registration<Id> {
    return {
      spec: { id, slots },
      load: async () => TestView.stub(id),
    };
  },

  /**
   * Wrap a registration so each `load()` increments a counter.
   * Useful for asserting memoization (eg. loads happen once per Id).
   */
  counter<Id extends string, Slot extends string>(regIn: t.Registration<Id, Slot>) {
    let count = 0;
    const reg: t.Registration<Id, Slot> = {
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
};
