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
import { Is } from './u.Is.ts';

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
} as const;
