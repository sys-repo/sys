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
import type { t } from '../common.ts';

/**
 * Helpers for working with resource paths.
 */
export const Path: t.PathLib = {
  join,
  joinGlobs,
  fromFileUrl,
  toFileUrl,
  resolve,
  relative,
  dirname,
  basename,
} as const;
