import type { t } from '../common.ts';

import {
  basename,
  dirname,
  extname,
  fromFileUrl,
  join,
  joinGlobs,
  normalize,
  relative,
  resolve,
  toFileUrl,
} from '@std/path';

import { Is } from './m.Is.ts';
import { Format } from './u.Format.ts';

/**
 * Helpers for working with resource paths.
 */
export const Path: t.PathLib = {
  Is,
  Format,
  join,
  joinGlobs,
  fromFileUrl,
  toFileUrl,
  resolve,
  relative,
  normalize,
  dirname,
  basename,
  absolute: (path) => (Is.absolute(path) ? path : resolve(path)),
  extname: (input: string) => (typeof input === 'string' ? extname(input) : ''),
} as const;
