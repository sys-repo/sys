import { type t, c, HashFmt, Time } from './common.ts';

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
