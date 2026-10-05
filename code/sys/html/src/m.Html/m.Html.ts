import { parse, parseFragment, type t } from './common.ts';
import { Is } from './m.Is.ts';

/**
 * Synchronous default-tree parsing. This does not sanitize HTML or execute scripts.
 */
export const Html: t.Html.Lib = Object.freeze({ parse, parseFragment, Is });
