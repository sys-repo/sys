import type { Plan } from '@sys/ui-factory/t';

import { Factory } from '@sys/ui-factory/core';
import { renderPlan } from '@sys/ui-factory/react';

/**
 * Minimal registration set: one React component.
 * Keep it untyped here and let `Factory.make` infer the module shape.
 */
const regs = [
  {
    spec: { id: 'Hello:view', slots: [] as const },
    load: async () => ({ default: (props: { name: string }) => <h1>Hello, {props.name}!</h1> }),
  },
] as const;

export const factory = Factory.make(regs);

/** A tiny canonical plan using the registration above. */
export const plan: Plan<typeof factory> = {
  root: { component: 'Hello:view', props: { name: 'World' } },
};

/** One-liner renderer the harness can call. */
export async function render() {
  return renderPlan(plan, factory);
}
