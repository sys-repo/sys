import { type t, Signal, D } from './common.ts';

const s = Signal.create;
// type Controller = t.DevLoaderController

export const controller: t.DevLoaderControllerFactory = (args) => {
  let rev = 0;
  // const defaults = args.props?.default;

  const p = {
    origin: args.origin ?? s<t.DevLoaderOriginKind>(args.props?.origin || D.origin.default),
  };

  const api: t.DevLoaderController = {
    get rev() {
      return rev;
    },
    get props(): t.DevLoaderController['props'] {
      return {
        ...Signal.toObject(p),
        default: args.props?.default,
        onOriginChange(e) {
          p.origin.value = e.next;
        },
      };
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
