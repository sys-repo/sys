import React from 'react';

import { type t } from './common.ts';
import type { ReactPlanViewProps } from './t.ts';

export type ReactPlanViewComponent = <F extends t.Factory<any, any>>(
  props: ReactPlanViewProps<F>,
) => React.ReactElement;

/**
 * React façade: directly render a resolved plan as React elements.
 * Bypasses the generic renderer; great for SSR and DevHarness.
 */
export const ReactPlanView: t.ReactPlanViewComponent = <F extends t.Factory<any, any>>(
  props: ReactPlanViewProps<F>,
) => {
  const { resolved } = props;
  const Component = (resolved.module.default ?? (() => null)) as React.ComponentType<any>;

  const slotProps: Record<string, unknown> = {};
  for (const [slot, childOrList] of Object.entries(resolved.slots ?? {})) {
    if (Array.isArray(childOrList)) {
      // Keying strategy:
      // - stable enough for harness;
      // - adapter path remains key-agnostic.
      slotProps[slot] = childOrList.map((c, i) => (
        <ReactPlanView key={`${String(c.component)}:${i}`} resolved={c as any} />
      ));
    } else {
      slotProps[slot] = <ReactPlanView resolved={childOrList as any} />;
    }
  }

  return <Component {...(resolved.props as any)} {...slotProps} />;
};
