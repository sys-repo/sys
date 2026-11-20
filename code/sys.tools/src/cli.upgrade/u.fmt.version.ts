import { Cli, Jsr, pkg, type t } from './common.ts';

/** Link a displayed @sys/tools version to its release only on terminal stdout. */
export function versionLink(
  version: t.StringSemver,
  color: (text: string) => string,
  terminal = Cli.Is.terminal('stdout'),
) {
  const label = color(version);
  if (!terminal) return label;
  const url = new URL(Jsr.Url.Pkg.web(pkg.name, version));
  return Cli.Fmt.hyperlink(label, url, { underline: true });
}
