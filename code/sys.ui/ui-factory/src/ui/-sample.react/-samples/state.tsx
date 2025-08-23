import { Factory } from '@sys/ui-factory/core';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

import React from 'react';
import type { t } from '../common.ts';

/**
 * Domain unions.
 */
type Id = 'Counter:view';
type Slot = never;

/** Document shape (optional count) */
export type SampleDoc = { count?: number };

/**
 * Counter component:
 * - Reads from an ImmutableRef<SampleDoc>.
 * - Subscribes on mount; disposes on unmount via the function returned by `subscribe`.
 * - Defaults missing `count` to 0.
 */
function Counter(props: { state: t.ImmutableRef<SampleDoc> }) {
  const { state } = props;
  const [value, setValue] = React.useState<SampleDoc>(state?.current ?? {});

  React.useEffect(() => {
    const events = state?.events();
    events.$.subscribe((e) => setValue(e.after));
    return events.dispose;
  }, [state.instance]);

  return (
    <div data-counter style={{ margin: 15, fontFamily: 'monospace' }}>
      state.count = {value.count}
    </div>
  );
}

/**
 * Registrations.
 */
const regs = [
  {
    spec: { id: 'Counter:view', slots: [] as const },
    load: async () => ({ default: Counter }),
  },
] satisfies readonly ReactRegistration<Id, Slot>[];

/** Factory. */
export const factory = Factory.make(regs);

/**
 * Plan — note that `state` is NOT created here.
 * The harness is responsible for creating the ImmutableRef instance
 * and injecting it into this plan (so tests/dev can reuse).
 *
 * Accept the same ref shape produced by your harness (doc + concrete op/event types).
 */
export function makePlan(state: t.ImmutableRef<SampleDoc, any, any>): Plan<typeof factory> {
  return {
    root: {
      component: 'Counter:view',
      props: { state },
    },
  };
}
