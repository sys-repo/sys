import type { t } from '../common.ts';

/** Remove edge blank lines while preserving internal and content-line whitespace. */
export const trimEdgeNewlines: t.Str.Lib['trimEdgeNewlines'] = (str = '') => {
  return str.replace(/\r\n/g, '\n').replace(/^\s*\n+|\n+\s*$/g, '');
};

/** Remove all leading and trailing forward slashes. */
export const trimSlashes: t.Str.Lib['trimSlashes'] = (str = '') => {
  return trimTrailingSlashes(trimLeadingSlashes(str));
};

/** Remove all leading forward slashes. */
export const trimLeadingSlashes: t.Str.Lib['trimLeadingSlashes'] = (str = '') => {
  return str.replace(/^\/+/, '');
};

/** Remove all trailing forward slashes. */
export const trimTrailingSlashes: t.Str.Lib['trimTrailingSlashes'] = (str = '') => {
  return str.replace(/\/+$/, '');
};

/** Remove one leading HTTP or HTTPS scheme. */
export const trimHttpScheme: t.Str.Lib['trimHttpScheme'] = (str = '') => {
  return str.replace(/^https?:\/\//, '');
};

/** Remove one or more leading `./` segments. */
export const trimLeadingDotSlash: t.Str.Lib['trimLeadingDotSlash'] = (str = '') => {
  return str.replace(/^(?:\.\/)+/, '');
};
