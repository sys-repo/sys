import type { t } from '../common.ts';

import {
  basename,
  dirname,
  fromFileUrl,
  join,
  joinGlobs,
  relative,
  resolve,
  toFileUrl,
} from '@std/path';
import { Is } from './m.Is.ts';

/**
 * Helpers for working with resource paths.
 */
export const Path: t.PathLib = {
  Is,
  join,
  joinGlobs,
  fromFileUrl,
  toFileUrl,
  resolve,
  relative,
  dirname,
  basename,
  absolute: (path) => (Is.absolute(path) ? path : resolve(path)),
} as const;
