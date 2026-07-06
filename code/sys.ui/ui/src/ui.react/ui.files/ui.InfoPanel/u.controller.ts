import React from 'react';
import { Rx, Signal, type t } from './common.ts';

/**
 * Create a signal-backed Files.InfoPanel controller.
 */
export const createController: t.Files.InfoPanel.ControllerFactory = (args = {}) => {
  const s = Signal.create;
  let rev = 0;

  const state = {
    debug: args.debug ?? s(args.props?.debug),
    theme: args.theme ?? s(args.props?.theme),
    snapshot: args.snapshot ?? s(args.props?.snapshot),
    events: {
      enabled: args.events?.enabled ?? s(args.props?.events?.enabled ?? false),
    },
  };

  const api = Rx.toLifecycle<t.Files.InfoPanel.Controller>({
    state,
    get rev() {
      return rev;
    },
    view(): ReturnType<t.Files.InfoPanel.Controller['view']> {
      const debug = state.debug.value;
      const theme = state.theme.value;
      const snapshot = state.snapshot.value;
      const eventsEnabled = state.events.enabled.value;
      return {
        debug,
        theme,
        snapshot,
        events: {
          enabled: eventsEnabled,
          onToggle: (next) => {
            state.events.enabled.value = next;
            args.events?.onToggle?.(next);
            args.props?.events?.onToggle?.(next);
          },
        },
      };
    },
    listen() {
      state.debug.value;
      state.theme.value;
      state.snapshot.value;
      state.events.enabled.value;
    },
  });

  const unsubscribe = Signal.effect(() => {
    api.listen();
    ++rev;
  });

  api.dispose$.subscribe(() => unsubscribe());

  return api;
};

/**
 * Read controller-backed InfoPanel view props inside a React lifecycle.
 */
export function useControlledView(args: t.Files.InfoPanel.ControllerArgs) {
  const controller = React.useMemo(
    () => createController(args),
    [
      args.debug,
      args.theme,
      args.snapshot,
      args.events?.enabled,
      args.events?.onToggle,
      args.props?.debug,
      args.props?.theme,
      args.props?.snapshot,
      args.props?.events?.enabled,
      args.props?.events?.onToggle,
    ],
  );

  React.useEffect(() => {
    return () => controller.dispose();
  }, [controller]);

  Signal.useRedrawEffect(controller.listen);
  return controller.view();
}
