import type { t } from './common.ts';

const origin = 'https://jsr.io';

export const Pkg: t.JsrUrlPkgLib = {
  metadata(name) {
    return `https://jsr.io/${name}/meta.json`;
  },

  version(name, version) {
    return `https://jsr.io/${name}/${version}_meta.json`;
  },
};

export const Url: t.JsrUrlLib = {
  origin,
  Pkg,
};
