import { type t, Factory } from '../common.ts';

/**
 * Domain unions.
 */
type Id = 'Boom:view';
type Slot = never;

/**
 * (Optional) A tiny component we’ll never reach because the loader throws.
 * Keeping it here makes it obvious what “should” have rendered.
 */
function WouldHaveRendered(props: { msg?: string }) {
  return <div data-ok>{props.msg ?? 'You will not see this.'}</div>;
}

/**
 * Registrations.
 * - `Boom:view` loader throws to simulate a failing bundle/data load.
 */
const regs = [
  {
    spec: { id: 'Boom:view', slots: [] as const },
    load: async () => {
      // Simulate a bundler/network error:
      throw new Error('boom');
      // (Unreachable, but shows intended module shape):
      return { default: WouldHaveRendered };
    },
  },
] satisfies readonly t.ReactRegistration<Id, Slot>[];

/** Factory. */
export const factory = Factory.make(regs);

/**
 * Plan that references the failing view.
 * - Resolving this plan will fail at load time.
 */
export const plan: t.Plan<typeof factory> = {
  root: {
    component: 'Boom:view',
    props: { msg: 'Should not render' },
  },
};
