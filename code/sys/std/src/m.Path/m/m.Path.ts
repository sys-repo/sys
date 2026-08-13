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

import type { t } from '../common.ts';

import { Bounded } from './m.Bounded.ts';
import { Format } from './m.Fmt.ts';
import { Is } from './m.Is.ts';
import { Join } from './m.Join.ts';
import { dir } from '../u/dir.ts';
import { ext, extname } from '../u/ext.ts';
import { relativePosix } from '../u/rel.ts';

/**
 * Helpers for working with resource paths.
 */
export const Path: t.Path.Lib = Object.freeze({
  Is,
  Format,
  Bounded,
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
  relativePosix,
});
