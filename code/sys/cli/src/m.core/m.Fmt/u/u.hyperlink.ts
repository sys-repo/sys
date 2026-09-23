import { c, type t } from '../common.ts';

const OSC_8 = '\x1b]8;;';
const STRING_TERMINATOR = '\x1b\\';

/**
 * Encode a terminal label as an OSC 8 hyperlink with opt-in underlining.
 */
export const hyperlink: t.CliFormat.Hyperlink.Fn = (label, url, options = {}) => {
  const display = options.underline === true ? c.underline(label) : label;
  return encodeHyperlink(display, url.href);
};

/** Encoded size of an already styled label and serialized target, including both OSC frames. */
export function hyperlinkCodeUnits(label: string, href: string): number {
  return label.length + href.length + 2 * (OSC_8.length + STRING_TERMINATOR.length);
}

/** Compose a link from the same styled label and serialized target used for size admission. */
export function encodeHyperlink(label: string, href: string): string {
  return `${OSC_8}${href}${STRING_TERMINATOR}${label}${OSC_8}${STRING_TERMINATOR}`;
}
