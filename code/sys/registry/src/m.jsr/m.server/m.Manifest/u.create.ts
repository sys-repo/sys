import { Fs } from '@sys/fs';
import { Err, Fetch, Path, Pkg, Rx, type t } from './common.ts';

/** Create a manifest helper from an existing definition. */
export const create: t.JsrManifest.Lib['create'] = (pkg, def) => {
  pkg = { ...pkg };
  def = { ...def };
  let _paths: undefined | t.StringPath[];
  const api: t.JsrManifest.Instance = {
    pkg,
    get paths() {
      return _paths || (_paths = Object.keys(def).sort());
    },
    get def() {
      return def;
    },

    async pull(input) {
      const options = wrangle.pullOptions(input);
      const life = Rx.lifecycle(options.until);
      const { dispose$ } = life;

      const fetch = Fetch.Pkg.file(pkg.name, pkg.version, { until: dispose$ });
      const baseUrl = Fetch.Url.Pkg.file(pkg.name, pkg.version, '');
      const errors = Err.errors();

      const paths = api.paths.filter((path) => {
        return options.filter ? options.filter(path) : true;
      });

      /**
       * Pull file content.
       */
      const loading = paths.map((path) => {
        const checksum = def[path]?.checksum;
        return fetch.text(path, { checksum });
      });
      const loaded = await Promise.all(loading);

      /**
       * Write to file-system.
       */
      let written: t.JsrManifest.Pull.Response['written'] | undefined;
      if (options.write) {
        const relative = Pkg.toString(pkg);
        const absolute = Path.resolve(options.write, relative);
        const items = loaded.filter((m) => m.ok && !!m.data);

        written = {
          absolute,
          relative,
          total: { files: items.length },
        };

        for (const item of items) {
          const url = item.ok ? item.finalUrl : item.url;
          const path = Path.join(absolute, url.slice(baseUrl.length));
          const res = await Fs.write(path, item.data || '');
          if (res.error) errors.push(res.error);
        }
      }

      /**
       * Wrangle errors.
       */
      const ok = loaded.every((m) => m.ok === true);
      if (!ok) loaded.filter((m) => !!m.error).forEach((m) => errors.push(m.error));

      // Finish up.
      return {
        ok,
        get files() {
          return loaded;
        },
        written,
        error: errors.toError(),
      };
    },
  };

  return api;
};

/**
 * Helpers
 */
const wrangle = {
  pullOptions(input: Parameters<t.JsrManifest.Instance['pull']>[0]): t.JsrManifest.Pull.Options {
    if (!input) return {};
    if (typeof input === 'string') return { write: input };
    return input;
  },
} as const;
