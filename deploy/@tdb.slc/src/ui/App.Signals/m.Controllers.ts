import { type t, Signal, rx } from './common.ts';
import { background } from './m.Controllers.background.ts';

export const Controllers: t.AppControllersLib = {
  background,

  start(state, until$) {
    const children = new Set<t.AppController>();
    const listeners = Signal.listeners(until$);
    const dispose$ = listeners.dispose$;

    // Initialize child controllers.
    children.add(background(state, dispose$));

    /**
     * API:
     */
    return rx.toLifecycle<t.AppController>(listeners, {
      id: 'Controller:App',
      get children() {
        return [...children];
      },
    });
  },
};
