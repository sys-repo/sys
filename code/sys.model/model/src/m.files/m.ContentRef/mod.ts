import { type t } from './common.ts';
import { bytes } from './m.bytes.ts';
import { text } from './m.text.ts';

/** Files-domain content-reference resolvers. */
export const ContentRef: t.Files.ContentRef.Lib = { bytes, text };
