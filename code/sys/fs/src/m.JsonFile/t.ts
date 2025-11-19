import type { t } from './common.ts';
import { getOrCreate } from './u.getOrCreate.ts';
import { getter } from './u.getter.ts';

type D = t.JsonFileDoc;

/**
 * Simple JSON based file-persitence for configuration settings file.
 */
export type JsonFileLib = {
  /** Get or create a config file handle (based on dir). */
  readonly getOrCreate: typeof getOrCreate;

  /** Creates a generator function with a curried type and base options. */
  readonly getter: typeof getter;

  /** Common defaults */
  default(): JsonFileDoc;
};

/** A curried file getter function  */
export type JsonFileGetter<T extends D = D> = (dir: t.StringDir) => Promise<t.JsonFile<T>>;
/** Curried arguments for the getter function */
export type JsonFileGetterArgs = { filename: string };

/**
 * Immutable representation of a persistable JSON file.
 */
export type JsonFile<T extends D = D> = t.ImmutableRef<T> & {
  /** File-system API for the file. */
  readonly file: {
    readonly path: t.StringPath;
    save(): Promise<{ error?: t.StdError }>;
  };
};
export type JsonFileDoc = { '.meta': JsonFileMeta };
export type JsonFileMeta = {
  createdAt: t.UnixTimestamp;
  modifiedAt?: t.UnixTimestamp;
};
