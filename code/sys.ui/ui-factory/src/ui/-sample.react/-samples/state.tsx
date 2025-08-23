import { Factory } from '@sys/ui-factory/core';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

import React from 'react';
import { type t, css } from '../common.ts';

/**
 * Domain unions.
 */
type Id = 'Counter:view';
type Slot = never;

/** Document shape (optional count) */
export type SampleDoc = { count?: number };
export type SampleState = t.ImmutableRef<SampleDoc>;

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

  const styles = {
    base: css({
      margin: 15,
      fontFamily: 'monospace',
      fontSize: 22,
    }),
  };

  return (
    <div data-counter className={styles.base.class}>
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
 * Construct plan with host initiated state.
 */
export function makePlan(state: SampleState): Plan<typeof factory> {
  return {
    root: {
      component: 'Counter:view',
      props: { state },
    },
  };
}
