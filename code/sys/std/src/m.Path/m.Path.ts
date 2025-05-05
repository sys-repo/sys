import type { t } from '../common.ts';
import { Join } from './m.Join.ts';

import {
  basename,
  dirname,
  extname,
  fromFileUrl,
  joinGlobs,
  normalize,
  relative,
  resolve,
  toFileUrl,
} from '@std/path';

import { Format } from './m.Format.ts';
import { Is } from './m.Is.ts';

/**
 * Helpers for working with resource paths.
 */
export const Path: t.PathLib = {
  Is,
  Format,
  Join,
  join: Join.auto,
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
