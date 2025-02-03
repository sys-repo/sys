import type { t } from './common.ts';

/**
 * Represents meta-data details a package (ESM Module).
 */
export type Pkg = { name: t.StringPkgName; version: t.StringSemver };

/** The name of a package. */
export type StringPkgName = string;

/**
 * Module identifier: @<scope>/<package-name>.
 * eg: "@sys/std"
 */
export type StringScopedPkgName = `@${string}/${string}`;

/**
 * A version of Pkg with a more tightly scoped "name" type.
 */
export type PkgScoped = { name: t.StringScopedPkgName; version: t.StringSemver };

/**
 * Common/minimal definition of the `package.json` file fields.
 */
export type PkgJsonNode = {
  name?: string;
  version?: t.StringSemver;
  dependencies?: { [key: string]: t.StringSemver };
  devDependencies?: { [key: string]: t.StringSemver };
};
