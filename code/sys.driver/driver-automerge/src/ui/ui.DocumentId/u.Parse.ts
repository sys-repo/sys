import { type t, CrdtIs } from './common.ts';

type P = t.DocumentIdParsed;

/**
 * Parsing helpers for textbox
 */
export const Parse: t.DocumentIdParseLib = {
  textbox(text: string = ''): P {
    const parsed: t.DeepMutable<P> = { text, id: '' };

    // Find the first slash:
    const slashIndex = text.indexOf('/');
    const idCandidate = slashIndex === -1 ? text : text.substring(0, slashIndex);

    // Only treat it as an ID if it validates:
    if (CrdtIs.id(idCandidate)) {
      parsed.id = idCandidate;

      // If there's more after the slash, split into path segments:
      if (slashIndex !== -1) {
        const rest = text.substring(slashIndex + 1);
        const segments = rest.split('/').filter((seg) => seg.length > 0);
        if (segments.length > 0) {
          parsed.path = segments as t.ObjectPath;
        }
      }
    }

    return parsed;
  },
} as const;
