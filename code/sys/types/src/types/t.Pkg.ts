/**
 * Represents meta-data details a package (ESM Module).
 */
export type Pkg = { name: string; version: string };

/**
 * Module identifier: @scope/<name>.
 * eg: "@sys/std"
 */
type Scope = string;
export type PkgName = `@${Scope}/${string}`;
