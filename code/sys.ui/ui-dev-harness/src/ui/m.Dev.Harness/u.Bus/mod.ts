import { BusController } from './Bus.Controller.ts';
import { BusEvents } from './Bus.Events.ts';
import { Is, Spec, type t } from './common.ts';

export * from './Bus.Events.ts';

type InstanceInput = t.DevInstance | t.DevCtx | t.TestHandlerArgs;

export const DevBus: t.DevBusLib = {
  Controller: BusController,
  Events: BusEvents,

  events(input: InstanceInput) {
    const ctx = wrangle.ctx(input);
    const dispose$ = ctx ? ctx.dispose$ : undefined;
    const instance = wrangle.instance(input);
    return DevBus.Events({ instance, dispose$ });
  },

  async withEvents(input: InstanceInput, handler: (events: t.DevEvents) => any) {
    const events = DevBus.events(input);
    const res = handler(events);
    if (Is.promise(res)) await res;
    events.dispose();
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  instance(input: InstanceInput) {
    if (Is.testArgs(input)) input = Spec.ctx(input);
    if (Is.ctx(input)) return input.toObject().instance;
    return input as t.DevInstance;
  },
  ctx(input: InstanceInput) {
    if (Is.testArgs(input)) input = Spec.ctx(input);
    return Is.ctx(input) ? input : undefined;
  },
} as const;
