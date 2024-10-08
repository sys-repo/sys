import type { t } from './common.ts';

/**
 * Object path tools.
 */
export type ObjectPathLib = {
  readonly Is: t.ObjectPathIsLib;
  readonly Mutate: t.ObjectPathMutateLib;
  prepend(target: t.ObjectPath, prefix: t.ObjectPath): t.ObjectPath;
  resolve<T>(root: unknown | unknown[], path: t.ObjectPath): T | undefined;
  resolver<T>(): ObjectPathResolver<T>;
  exists(root: unknown, path: t.ObjectPath): boolean;
  fromString(path: string): t.ObjectPath;
  from(input: any): t.ObjectPath;
};

/**
 * Mutatation helpers.
 */
export type ObjectPathMutateLib = {
  value<T>(root: unknown, path: t.ObjectPath, value: T): void;
  ensure<T>(root: unknown | unknown[], path: t.ObjectPath, defaultValue: T): T;
  delete(root: unknown, path: t.ObjectPath): void;
};

/**
 * Flag evaluators.
 */
export type ObjectPathIsLib = {
  path(input: any): input is t.ObjectPath;
};

/**
 * A a strongly typed version of the resolver.
 */
export type ObjectPathResolver<T> = (
  root: unknown | unknown[],
  path: t.ObjectPath,
) => T | undefined;
