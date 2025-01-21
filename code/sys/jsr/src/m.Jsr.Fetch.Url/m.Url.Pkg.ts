import { type t, origin } from './common.ts';

export const Pkg: t.JsrUrlPkgLib = {
  metadata(name) {
    return `${origin}/${name}/meta.json`;
  },

  version(name, version) {
    return `${origin}/${name}/${version}_meta.json`;
  },
};
