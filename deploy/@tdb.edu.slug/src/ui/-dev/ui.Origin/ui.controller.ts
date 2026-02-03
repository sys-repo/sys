import { type t, Signal, D } from './common.ts';

export const controller: t.DevOriginControllerFactory = (args) => {
  let rev = 0;

  const s = Signal.create;
  const p = {
    kind: args.kind ?? s<t.DevOriginKind>(args.props?.kind || D.kind.default),
  };

  const api: t.DevOriginController = {
    get rev() {
      return rev;
    },
    get props(): t.DevOriginController['props'] {
      const v = Signal.toObject(p);
      return {
        kind: v.kind,
        default: args.props?.default,
        onChange(e) {
          p.kind.value = e.next;
        },
      };
    },
    get origin() {
      return null as any;
      // const current = p.origin.value;
      // if (current === 'localhost') return args.props?.default?.origin?.local ||kindgin.local;
      // return args.props?.default?.origin?.prod ||kindgin.prod;
    },
    listen() {
      api.props;
    },
  };

  Signal.effect(() => {
    api.listen();
    ++rev;
  });

  return api;
};
