import { type t, Signal, D } from './common.ts';

const s = Signal.create;

export const controller: t.DevOriginControllerFactory = (args) => {
  let rev = 0;

  const p = {
    origin: args.origin ?? s<t.DevOriginKind>(args.props?.origin || D.origin.default),
  };

  const api: t.DevOriginController = {
    get rev() {
      return rev;
    },
    get props(): t.DevOriginController['props'] {
      return {
        ...Signal.toObject(p),
        default: args.props?.default,
        onOriginChange(e) {
          p.origin.value = e.next;
        },
      };
    },
    get origin() {
      const current = p.origin.value;
      if (current === 'localhost') return args.props?.default?.origin?.local || D.origin.local;
      return args.props?.default?.origin?.prod || D.origin.prod;
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
