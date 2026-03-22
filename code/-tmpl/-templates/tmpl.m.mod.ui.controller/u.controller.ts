import React from 'react';
import { type t, Rx, Signal } from './common.ts';

export const createController: t.MyCtrlControllerFactory = (args) => {
  const s = Signal.create;
  let rev = 0;

  const state = {
    debug: args.debug ?? s(args.props?.debug),
    theme: args.theme ?? s(args.props?.theme),
  };

  const api = Rx.toLifecycle<t.MyCtrlController>({
    state,
    get rev() {
      return rev;
    },
    view(): ReturnType<t.MyCtrlController['view']> {
      const v = Signal.toObject(state);
      return { debug: v.debug, theme: v.theme };
    },
    listen() {
      Signal.toObject(state);
    },
  });

  const unsubscribe = Signal.effect(() => {
    api.listen();
    ++rev;
  });

  api.dispose$.subscribe(() => unsubscribe());

  return api;
};

export function useControlledView(args: t.MyCtrlControllerArgs) {
  const controller = React.useMemo(
    () => createController(args),
    [args.debug, args.theme, args.props?.debug, args.props?.theme],
  );

  React.useEffect(() => {
    return () => controller.dispose();
  }, [controller]);

  Signal.useRedrawEffect(controller.listen);
  return controller.view();
}
