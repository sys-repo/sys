import { type t, V } from './common.ts';

type L = t.SlugPatternLib['Type'];

/**
 * MIME type pattern:
 * - RFC 2045/6838-ish: "type/subtype"
 * - tokens allow letters, digits, and !#$&^_.+-
 * - subtype may include dots (e.g., vnd.google-apps.document)
 */
export const MIME_PATTERN = '^[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]*/[A-Za-z0-9][A-Za-z0-9.!#$&^_+-]*$';

export const Mime: L['Mime'] = (o = {}) => {
  return V.string({
    pattern: MIME_PATTERN,
    description: 'MIME type (media type), e.g. "image/png".',
    ...o,
  }) as ReturnType<L['Mime']>;
};
