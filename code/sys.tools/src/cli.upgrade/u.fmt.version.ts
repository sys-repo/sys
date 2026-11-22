import { Cli, pkg, type t } from './common.ts';

/** Link a displayed @sys/tools version to its release only on terminal stdout. */
export function versionLink(
  version: t.StringSemver,
  color: (text: string) => string,
  terminal = Cli.Is.terminal('stdout'),
) {
  return color(Cli.Fmt.jsrVersion({ name: pkg.name, version }, { link: terminal }));
}
