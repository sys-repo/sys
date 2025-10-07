import { type t, origin } from './common.ts';
import type { JsrUrlPkgLib } from './t.ts';

export const Pkg: JsrUrlPkgLib = {
  metadata(name) {
    return `${origin}/${name}/meta.json`;
  },

  version(name, version) {
    return `${origin}/${name}/${version}_meta.json`;
  },

  file(...args: any[]) {
    const p = wrangle.fileParams(args);
    const path = wrangle.normalizePath(p.path);
    return `${origin}/${p.pkg.name}/${p.pkg.version}/${path}`;
  },

  /**
   * Canonical contract/module refs for a given source path.
   */
  ref(pkg, contractPath, modulePath) {
    const contract = Pkg.file(pkg, contractPath);
    const module = Pkg.file(pkg, modulePath);
    return { contract, module };
  },
};

/**
 * Helpers:
 */
const wrangle = {
  normalizePath(path: string) {
    return path.replace(/^\//, '');
  },

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
