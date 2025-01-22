import { type t, origin } from './common.ts';

export const Pkg: t.JsrUrlPkgLib = {
  metadata(name) {
    return `${origin}/${name}/meta.json`;
  },

  version(name, version) {
    return `${origin}/${name}/${version}_meta.json`;
  },

  file(name, version, path) {
    path = path.replace(/^\//, '');
    return `${origin}/${name}/${version}/${path}`;
  },
};
