import { type t } from '../common.ts';

const OSC_8 = '\x1b]8;;';
const STRING_TERMINATOR = '\x1b\\';

/** Encode an absolute URL and terminal presentation label as an OSC 8 hyperlink. */
export const hyperlink: t.CliFormat.Hyperlink.Fn = (label, url) => {
  return `${OSC_8}${url.href}${STRING_TERMINATOR}${label}${OSC_8}${STRING_TERMINATOR}`;
};
