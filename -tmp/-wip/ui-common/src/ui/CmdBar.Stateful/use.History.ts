import { useEffect } from 'react';
import { Ctrl, DEFAULTS, Mutate, rx, type t } from './common.ts';

/**
 * Manage history
 */
export function useHistory(args: {
  enabled?: boolean;
  state?: t.CmdTransport;
  ctrl?: t.CmdBarCtrl;
  paths?: t.CmdBarPaths;
}) {
  const { enabled = true, state, ctrl, paths = DEFAULTS.paths } = args;
  const pathDeps = `${paths.text.join('.')}`;
  const resolve = Ctrl.Path.resolver(paths);

  const append = (state: t.CmdTransport) => {
    const text = api.text.trim();
    const history = api.history;
    const latest = history[history.length - 1];
    if (text && latest !== text) {
      state.change((d) => Mutate.meta(d, paths, (meta) => meta.history.push(text)));
    }
  };

  useEffect(() => {
    const life = rx.disposable();

    if (enabled && ctrl && state) {
      const events = ctrl.events(life.dispose$);

      /**
       * Save new items to history on "ENTER" (Invoke).
       */
      events.on('Invoke', (e) => append(state));

      /**
       * History
       */
      events.on('History', (e) => {
        console.log('🐷TODO: history', e.params);
      });
    }

    if (!enabled) life.dispose();
    return life.dispose;
  }, [enabled, ctrl, state?.instance, pathDeps]);

  /**
   * API
   */
  const api = {
    enabled,
    get text() {
      return state ? resolve(state.current).text : '';
    },
    get history() {
      return state ? resolve(state.current).meta.history : [];
    },
  } as const;
  return api;
}
