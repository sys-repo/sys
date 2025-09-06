import { type t } from './common.ts';

type OptInput = t.FileMapToMapOptions | t.FileMapFilter;

/**
 * Convert a directory to an in-memory FileMap (keys sorted).
 */
export type FileMapToMap = (dir: t.StringDir, options?: OptInput) => Promise<t.FileMap>;
/** Options passed to the `FileMap.toMap` method. */
export type FileMapToMapOptions = { filter?: t.FileMapFilter };
