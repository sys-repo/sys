import { type t, c, HashFmt } from './common.ts';

export const digest: t.ViteLogLib['digest'] = (hash?: t.StringHash) => {
  if (!hash) return '';
  const uri = HashFmt.digest(hash);
  return c.gray(`${c.green('←')} ${uri}`);
};

export const pad: t.ViteLogLib['pad'] = (text, pad) => {
  text = text.trim();
  return pad ? `\n${text}\n` : text;
};
