import type { t } from './common.ts';
import { Fallback } from './m.Fallback.ts';
import { Is } from './m.Is.ts';
import { fromDataUri } from './u/u.fromDataUri.ts';
import { fromExtension } from './u/u.fromExtension.ts';
import { fromPath } from './u/u.fromPath.ts';
import { toContentType } from './u/u.toContentType.ts';

/**
 * Canonical media-type authority.
 */
export const MediaType: t.MediaType.Lib = Object.freeze({
  Is,
  Fallback,
  fromExtension,
  fromPath,
  fromDataUri,
  toContentType,
});
