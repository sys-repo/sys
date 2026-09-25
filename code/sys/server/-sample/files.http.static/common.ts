import type * as t from './t.ts';

export type { t };

/**
 * Libraries:
 */
export { Hash } from '@sys/crypto/hash';
export { Fs } from '@sys/fs';
export { Fetch } from '@sys/http/client';
export { HttpStatic } from '@sys/http/server/static';
export { Files } from '@sys/model/files';
export { FilesStatic } from '@sys/model/files/static';
export { Json } from '@sys/std/json';
export { Pkg } from '@sys/std/pkg';

/**
 * Sample default values.
 */
const port = 1235;
export const DEFAULTS = {
  name: 'sample:files:http:static',
  port,
  url: `http://127.0.0.1:${port}`,
  dist: '/dist.json',
} as const;

/** Short alias for sample defaults. */
export const D = DEFAULTS;
