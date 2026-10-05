import type { t } from './common.ts';
import { binary, text, valid } from './u/u.is.ts';

/** Media-type predicates. */
export const Is: t.MediaType.Is.Lib = Object.freeze({ valid, text, binary });
