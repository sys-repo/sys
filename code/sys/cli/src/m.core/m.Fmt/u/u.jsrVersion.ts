import { Is, JsrUrl, Semver, type t } from '../common.ts';
import { hyperlink } from './u.hyperlink.ts';

const UNSAFE_LABEL = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u;

/**
 * Format the version label with an optional release link; ANSI styling controls its underline.
 */
export const jsrVersion: t.CliFormat.Lib['jsrVersion'] = ({ name, version }, { link }) => {
  if (!Is.str(version) || UNSAFE_LABEL.test(version)) return 'invalid version';
  if (!link || !JsrUrl.Pkg.Is.name(name) || !Semver.Is.exact(version)) return version;

  return hyperlink(version, new URL(JsrUrl.Pkg.web(name, version)), { underline: true });
};
