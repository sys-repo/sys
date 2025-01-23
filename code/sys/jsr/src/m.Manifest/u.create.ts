import { type t, Err, Fetch, rx } from './common.ts';

export const create: t.JsrManifestLib['create'] = (pkg, def) => {
  pkg = { ...pkg };
  def = { ...def };
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
      const { dispose$ } = life;
      const fetch = Fetch.Pkg.file(pkg.name, pkg.version, { dispose$ });

      const loading = api.paths.map((path) => {
        const checksum = def[path]?.checksum;
        return fetch.text(path, { checksum });
      });
      const loaded = await Promise.all(loading);

      const errors = Err.errors();
      const ok = loaded.every((m) => m.ok === true);
      if (!ok) loaded.filter((m) => !!m.error).forEach((m) => errors.push(m.error));

      return {
        ok,
        files: loaded,
        error: errors.toError(),
      };
    },
  };

  return api;
};
