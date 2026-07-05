import { c, Cli, pkg, Str, type t } from './common.ts';

export function rootAdvisoryPrelude(remote?: t.StringSemver) {
  const { gray: g, green, white: w } = c;
  const hr = c.green(Cli.Fmt.hr());
  const width = Cli.stripAnsi(hr).length;
  const message = `${g('Run ')}${w('sys upgrade ')}${green('--latest')}`;
  const latest = remote ? `${g('next available ')}${w(remote)}` : undefined;

  return Str.builder()
    .line(hr)
    .line(rootAdvisoryLine({ width, message, latest }))
    .line(hr)
    .toString();
}

export function rootPendingAdvisoryPrelude(remote: t.StringSemver) {
  const hr = c.green(Cli.Fmt.hr());
  return Str.builder()
    .line(hr)
    .line(c.white(`${pkg.name} ${remote} published; upgrade pending — standing down`))
    .line(c.gray(c.italic('supply-chain buffer holding this release back')))
    .line(hr)
    .toString();
}

function rootAdvisoryLine(args: { width: number; message: string; latest?: string }) {
  const { width, message, latest } = args;
  if (!latest) return message;

  const left = Cli.stripAnsi(message).length;
  const right = Cli.stripAnsi(latest).length;
  const spaces = width - left - right;
  if (spaces < 2) return message;
  return `${message}${' '.repeat(spaces)}${latest}`;
}
