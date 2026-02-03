import { type t, Signal, D, Rx } from './common.ts';
import { resolveOrigin } from './u.resolve.ts';

export const createController: t.DevOriginControllerFactory = (args) => {
  let rev = 0;

  const s = Signal.create;
  const p = {
    kind: args.kind ?? s(args.props?.kind || D.kind.default),
    origin: args.origin ?? s(D.kind.local),
  };

  const api = Rx.toLifecycle<t.DevOriginController>({
    ...p,
    get rev() {
      return rev;
    },
    get props(): t.DevOriginController['props'] {
      const v = Signal.toObject(p);
      return {
        kind: v.kind,
        defaults: args.props?.defaults,
        onChange: (e) => (p.kind.value = e.next),
      };
    },
    listen() {
      Signal.toObject(p);
    },
  });

  const a = Signal.effect(() => {
    api.listen();
    ++rev;
  });

  const b = Signal.effect(() => {
    const kind = p.kind.value;
    const defaults = args.props?.defaults?.origin;
    const { origin } = resolveOrigin({ kind, defaults });
    p.origin.value = origin;
  });

  api.dispose$.subscribe(() => {
    a();
    b();
  });

  return api;
};
