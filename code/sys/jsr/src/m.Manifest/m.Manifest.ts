import { type t, Fetch, Err } from './common.ts';

/**
 * Tools for working with a module's source-code.
 */
export const Manifest: t.JsrManifestLib = {
  create(pkg, def) {
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
    };
    return api;
  },

  async fetch(name, version) {
    const errors = Err.errors();
    const res = await Fetch.Pkg.info(name, version);
    const { data, error, status } = res;

    if (error) errors.push(error);
    if (!error) {
      // Double-check for the existence of required data.
      if (!data) errors.push('Failed to retrieve response data from origin.');
      if (data && !data.manifest) errors.push('Failed to retrieve manifest details from origin.');
    }
    if (res.error || !data || !data.manifest) {
      return { status, error: errors.toError()! };
    }

    const manifest = Manifest.create(data.pkg, data.manifest);
    return {
      status,
      manifest,
      error: undefined,
    };
  },
};
