import type { t } from '../common.ts';

type InstanceInput = t.DevInstance | t.DevCtx | t.TestHandlerArgs;

/**
 * Library of tools for the dev-harness's [EventBus].
 */
export type DevBusLib = {
  /**
   * Start the controller and return an event API.
   */
  Controller(args: {
    instance: t.DevInstance;
    env?: t.DevEnvVars;
    filter?: (e: t.DevEvent) => boolean;
    dispose$?: t.UntilObservable;
  }): t.DevEvents;

  /**
   * Events API.
   */
  Events(args: {
    instance: { bus: t.EventBus<any>; id: t.StringId };
    filter?: (e: t.DevEvent) => boolean;
    dispose$?: t.UntilObservable;
  }): t.DevEvents;

  /**
   * Events events API from an instance.
   */
  events(input: InstanceInput): t.DevEvents;

  /**
   * Invoke a callback handler with a transient instance of the events API.
   */
  withEvents(input: InstanceInput, handler: (events: t.DevEvents) => any): void;
};
