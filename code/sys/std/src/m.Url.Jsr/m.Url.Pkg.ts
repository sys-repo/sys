import { type t, origin } from './common.ts';

export const Pkg: t.JsrUrlPkgLib = {
  metadata(name) {
    return `${origin}/${name}/meta.json`;
  },

  version(name, version) {
    return `${origin}/${name}/${version}_meta.json`;
  },

  file(...args: any[]) {
    const p = wrangle.fileParams(args);
    let path = p.path;
    path = path.replace(/^\//, '');
    return `${origin}/${p.pkg.name}/${p.pkg.version}/${path}`;
  },
};

/**
 * Helpers:
 */
const wrangle = {
  fileParams(args: any[]): { pkg: t.Pkg; path: string } {
    const total = args.length;

    if (total === 2 && typeof args[0] === 'object') {
      return { pkg: args[0], path: args[1] };
    }

    if (total === 3 && typeof args[0] === 'string') {
      const pkg = { name: args[0], version: args[1] };
      return { pkg, path: args[2] };
    }

    throw new Error(`Could not parse overloaded args.`);
  },
} as const;
