import type { t } from '../common.ts';
import { Wrangle } from './u.ts';

const handlers = new Set<t.ActiveElementChangedHandler>();
let initialized = false;

/**
 * Singleton helper for monitoring the documents current
 * focused element (aka the "ActiveElement").
 */
export const ActiveElement = {
  get listenerTotal() {
    return handlers.size;
  },

  listen(handler: t.ActiveElementChangedHandler) {
    handlers.add(handler);

    if (!initialized) {
      const onChange = (focus: boolean) => {
        return (_e: FocusEvent) => {
          const el = document.activeElement || undefined;
          handlers.forEach((fn) => fn(Wrangle.args(focus, el)));
        };
      };

      // NB: Window event only ever added once.
      globalThis.addEventListener('focusin', onChange(true));
      globalThis.addEventListener('focusout', onChange(false));
    }

    initialized = true;
    return {
      dispose() {
        handlers.delete(handler);
      },
    };
  },
};
