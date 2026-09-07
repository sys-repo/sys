import { c, type t } from '../common.ts';

const OSC_8 = '\x1b]8;;';
const STRING_TERMINATOR = '\x1b\\';

/**
 * Encode a terminal label as an OSC 8 hyperlink with opt-in underlining.
 */
export const hyperlink: t.CliFormat.Hyperlink.Fn = (label, url, options = {}) => {
  const display = options.underline === true ? c.underline(label) : label;
  return `${OSC_8}${url.href}${STRING_TERMINATOR}${display}${OSC_8}${STRING_TERMINATOR}`;
};
