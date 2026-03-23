import { type t, Err } from './common.ts';

/**
 * Network fetching helpers against a specific npm package.
 */
export const Pkg: t.NpmFetch.PkgLib = {
  async versions(_name, _options = {}) {
  },

  async info(_name, _version, _options = {}) {
  },
};
