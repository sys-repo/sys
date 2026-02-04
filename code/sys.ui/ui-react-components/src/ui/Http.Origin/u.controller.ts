import { type t, D, Rx, Signal } from './common.ts';
import { resolveOrigin } from './u.resolve.ts';

export const createController: t.HttpOriginControllerFactory = (args) => {
  const s = Signal.create;
  let rev = 0;
  const state = {
    kind: args.env ?? s(args.props?.env || D.env.default),
    origin: args.origin ?? s(D.env.local),
  };

  const api = Rx.toLifecycle<t.HttpOriginController>({
    state,
    get rev() {
      return rev;
    },
    view(): ReturnType<t.HttpOriginController['view']> {
      const v = Signal.toObject(state);
      return {
        env: v.kind,
        defaults: args.props?.defaults,
        onChange: (e) => (state.kind.value = e.next),
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
    const kind = state.kind.value;
    const defaults = args.props?.defaults?.origin;
    const { origin } = resolveOrigin({ kind, defaults });
    state.origin.value = origin;
  });

  api.dispose$.subscribe(() => {
    unsubscribeA();
    unsubscribeB();
  });

  return api;
};
