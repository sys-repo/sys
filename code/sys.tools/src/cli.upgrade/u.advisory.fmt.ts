import { c, Cli, pkg, Str, type t } from './common.ts';
import { StanddownTiming } from './u.standdown.ts';

export function rootAdvisoryPrelude(remote?: t.StringSemver) {
  const { gray: g, green, white: w } = c;
  const hr = c.green(Cli.Fmt.hr());
  const width = Cli.stripAnsi(hr).length;
  const left = `${g('Run ')}${w('sys upgrade ')}${green('--latest')}`;
  const right = remote ? `${g('next available ')}${w(remote)}` : undefined;

  return Str.builder()
    .line(hr)
    .line(rootAdvisoryLine({ width, left, right }))
    .line(hr)
    .toString();
}

export function rootPendingAdvisoryPrelude(
  remote: t.StringSemver,
  options: { readonly remaining?: t.Msecs } = {},
) {
  const hr = c.green(Cli.Fmt.hr());
  const width = Cli.stripAnsi(hr).length;
  const title = rootAdvisoryLine({
    width,
    left: c.white('upgrade pending — standing down'),
    right: `${c.gray('next:')}${c.white(pkg.name)} ${c.white(remote)}`,
  });
  const waiting = StanddownTiming.formatWait(options.remaining);
  return Str.builder()
    .line(hr)
    .line(title)
    .line(c.gray(c.italic(waiting)))
    .line(hr)
    .toString();
}

function rootAdvisoryLine(args: { width: number; left: string; right?: string }) {
  const { width, left, right } = args;
  if (!right) return left;

  const leftWidth = Cli.stripAnsi(left).length;
  const rightWidth = Cli.stripAnsi(right).length;
  const spaces = width - leftWidth - rightWidth;
  if (spaces < 2) return left;
  return `${left}${' '.repeat(spaces)}${right}`;
}
