import { type t, Factory } from '../common.ts';

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
export const plan: t.Plan<typeof factory> = {
  root: { component: 'Hello:view', props: { name: 'World' } },
};
