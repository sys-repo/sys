import { type t, Err, rx, Http } from './common.ts';

export const create: t.JsrManifestLib['create'] = (pkg, def) => {
  let _paths: undefined | t.StringPath[];
  const api: t.JsrManifest = {
    pkg,
    get paths() {
      return _paths || (_paths = Object.keys(def).sort());
    },
    get def() {
      return def;
    },

    async pull(options = {}) {
      const life = rx.lifecycle(options.dispose$);
      /**
       * TODO 🐷 fetch and save all files.
       */
      return {};
    },
  };
  return api;
};
