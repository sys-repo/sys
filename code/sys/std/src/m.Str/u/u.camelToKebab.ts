import { Is, type t } from '../common.ts';

/** Convert a camel-case string to kebab-case. */
export const camelToKebab: t.Str.Lib['camelToKebab'] = (text) => {
  if (!Is.string(text)) return '';
  return text.replace(
    /[A-Z]/g,
    (match, offset) => (offset > 0 && text[offset - 1] !== '-' ? '-' : '') + match.toLowerCase(),
  );
};
