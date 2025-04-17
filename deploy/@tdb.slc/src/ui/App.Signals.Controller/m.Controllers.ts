import { type t, Signal, rx } from './common.ts';
import { background } from './m.Controllers.background.ts';

export const Controllers: t.AppControllersLib = {
  background,

  start(state, until$) {
    const kind: t.AppControllerKind = 'Controller:App';
    const children = new Set<t.AppController>();
    const listeners = Signal.listeners(until$);
    const controllers = state.props.controllers;
    controllers.listening.value = [...controllers.listening.value, kind];

    // Initialize child controllers.
    children.add(background(state, listeners.dispose$));

    /**
     * API:
     */
    return rx.toLifecycle<t.AppController>(listeners, {
      kind,
      get children() {
        return [...children];
      },
    });
  },
};
