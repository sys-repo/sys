import { Factory } from '@sys/ui-factory/core';
import type { Plan } from '@sys/ui-factory/t';

/**
 * Minimal registration set: one React component.
 * Keep it untyped here and let `Factory.make` infer the module shape.
 */
const regs = [
  {
    spec: { id: 'Hello:view', slots: [] },
    load: async () => ({ default: (props: { name: string }) => <h1>Hello, {props.name}! 👋</h1> }),
  },
] as const;

export const factory = Factory.make(regs);

/** A tiny canonical plan using the registration above. */
export const plan: Plan<typeof factory> = {
  root: { component: 'Hello:view', props: { name: 'World' } },
};
