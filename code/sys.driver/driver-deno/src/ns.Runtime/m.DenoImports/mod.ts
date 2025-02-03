/**
 * @module
 * Tools for working with the dependency/imports of a Deno mono-repo.
 */
import { type t } from './common.ts';
import { fromYaml } from './u.fromYaml.ts';

export const DenoImports: t.DenoImportsLib = {
  fromYaml,
};
