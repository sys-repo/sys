import { rx, slug } from '../common.ts';
import { DevBus } from '../u/Bus/mod.ts';
import { Context } from '../u/Ctx/mod.ts';
import { SAMPLES } from './sample.specs.unit-test/mod.ts';

/**
 * Sample test factories.
 */
export const TestSample = {
  instance: () => ({ bus: rx.bus(), id: `foo.${slug()}` }),

  controller() {
    const instance = TestSample.instance();
    const events = DevBus.Controller({ instance });
    return { events, instance } as const;
  },

  async preloaded() {
    const { events, instance } = TestSample.controller();
    await events.load.fire(SAMPLES.Sample1);
    return { events, instance } as const;
  },

  async context() {
    const { instance, events } = TestSample.controller();
    const context = await Context.init(instance);
    const ctx = context.ctx;
    context.dispose$.subscribe(() => events.dispose());
    const dispose = () => {
      context.dispose();
      events.dispose();
    };
    return { context, ctx, instance, events, dispose } as const;
  },
};
