import { c, Cli, HashFmt, Is, Str, stripAnsi, type t, Time } from './common.ts';

const MINUTE = 60_000;

export const digest: t.ViteLog.Lib['digest'] = (hash?: t.StringHash) => {
  if (!hash) return '';
  const uri = HashFmt.digest(hash);
  return c.gray(`${c.green('←')} ${uri}`);
};

export const elapsed: t.ViteLog.Lib['elapsed'] = (msec) => {
  if (msec == null) return '-';
  if (msec > MINUTE) return `${(msec / MINUTE).toFixed(2)}m`;
  return String(Time.duration(msec));
};

export const pad: t.ViteLog.Lib['pad'] = (text, pad) => {
  text = text.trim();
  return pad ? `\n${text}\n` : text;
};

export function outputWidth(input?: number) {
  return Is.num(input) ? Math.max(0, Math.floor(input)) : Cli.Fmt.Text.fitWidth();
}

export function reserveWidth(width: number, reserve: number) {
  return Math.max(0, Math.floor(width) - Math.max(0, Math.floor(reserve)));
}

export function clipLine(input: string, width: number) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.visibleWidth(input) <= width) return input;
  return c.gray(clipText(stripAnsi(input), width));
}

export function clipText(input: string, width: number) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.visibleWidth(input) <= width) return input;
  return Str.ellipsize(input, width);
}
