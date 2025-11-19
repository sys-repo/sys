import type { t } from './common.ts';
import { getOrCreate, getter } from './u.get.ts';

type D = t.ConfigFileDoc;

/**
 * Simple JSON based file-persitence for configuration settings file.
 */
export type ConfigFileLib = {
  /** Get or create a config file handle singleton (based on dir). */
  readonly getOrCreate: typeof getOrCreate;

  /** Creates a generator function with a curried type and base options. */
  readonly getter: typeof getter;

  /** Common defaults */
  default(): ConfigFileDoc;
};

/** A curried config-file retrieval function  */
export type ConfigFileGetter<T extends D = D> = (dir: t.StringDir) => Promise<t.ConfigFile<T>>;

/** Filename */
export type ConfigFileGetOptions = { filename?: string };

/**
 * Immutable representation of a persistable JSON config file.
 */
export type ConfigFile<T extends D = D> = t.ImmutableRef<T> & {
  /** File-system API for the config. */
  readonly file: {
    readonly path: t.StringPath;
  };
};
export type ConfigFileDoc = { '.meta': ConfigFileMeta };
export type ConfigFileMeta = { createdAt: t.UnixTimestamp };
