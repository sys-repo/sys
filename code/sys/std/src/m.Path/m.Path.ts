import type { t } from './common.ts';
import { Join } from './m.Join.ts';
import { dir } from './u.dir.ts';
import { ext, extname } from './u.ext.ts';

import {
  basename,
  dirname,
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
  extname,
  ext,
  dir,
} as const;
