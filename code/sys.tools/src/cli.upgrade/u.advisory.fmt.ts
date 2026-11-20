import { c, Cli, Jsr, pkg, Str, type t } from './common.ts';
import { StanddownTiming } from './u.standdown.ts';

export function rootAdvisoryPrelude(remote?: t.StringSemver) {
  const { gray: g, green, white: w } = c;
  const hr = c.green(Cli.Fmt.hr());
  const width = Cli.Fmt.Text.Width.measure(hr);
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
  options: {
    readonly remaining?: t.Msecs;
    readonly width?: number;
    readonly terminal?: boolean;
  } = {},
) {
  const hr = c.green(Cli.Fmt.hr({ width: options.width }));
  const width = Cli.Fmt.Text.Width.measure(hr);
  const terminal = options.terminal ?? Cli.Is.terminal('stdout');
  const label = c.white(remote);
  const version = terminal
    ? Cli.Fmt.hyperlink(label, new URL(Jsr.Url.Pkg.web(pkg.name, remote)), { underline: true })
    : label;
  const title = rootAdvisoryLine({
    width,
    left: c.white('auto-upgrade pending — standing down'),
    right: `${c.gray('next:')}${c.white(pkg.name)} ${version}`,
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

  const { measure } = Cli.Fmt.Text.Width;
  const leftWidth = measure(left);
  const rightWidth = measure(right);
  const spaces = width - leftWidth - rightWidth;
  if (spaces < 2) return left;
  return `${left}${' '.repeat(spaces)}${right}`;
}
