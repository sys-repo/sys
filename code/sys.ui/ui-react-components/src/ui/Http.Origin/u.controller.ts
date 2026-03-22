import React from 'react';
import { type t, Rx, Signal } from './common.ts';
import { resolveOrigin } from './u.resolve.ts';

export const createController: t.HttpOrigin.ControllerFactory = (args) => {
  const s = Signal.create;
  let rev = 0;
  const state = {
    env: args.env ?? s(args.props?.env || 'localhost'),
    origin: args.origin ?? s<t.UrlTree | undefined>(undefined),
  };

  const api = Rx.toLifecycle<t.HttpOrigin.Controller>({
    state,
    get rev() {
      return rev;
    },
    view(): ReturnType<t.HttpOrigin.Controller['view']> {
      const v = Signal.toObject(state);
      return {
        env: v.env,
        spec: args.props?.spec,
        onChange: (e) => (state.env.value = e.next),
      };
    },
    listen() {
      Signal.toObject(state);
    },
  });

  const unsubscribeA = Signal.effect(() => {
    api.listen();
    ++rev;
  });

  const unsubscribeB = Signal.effect(() => {
    const env = state.env.value;
    const defaults = args.props?.spec;
    const { origin } = resolveOrigin({ env, defaults });
    state.origin.value = origin;
  });

  api.dispose$.subscribe(() => {
    unsubscribeA();
    unsubscribeB();
  });

  return api;
};

export function useControlledView(args: t.HttpOrigin.ControllerArgs) {
  const controller = React.useMemo(
    () => createController(args),
    [args.env, args.origin, args.props?.env, args.props?.spec],
  );

  React.useEffect(() => {
    return () => controller.dispose();
  }, [controller]);

  Signal.useRedrawEffect(controller.listen);
  return controller.view();
}
