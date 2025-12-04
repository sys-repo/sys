import { type t } from './common.ts';

export const expandTilde: t.FsExpandTilde = (input) => {
  const home = Deno.env.get('HOME');
  if (!home) return input;

  if (input === '~') return home;
  if (input.startsWith('~/')) return `${home}/${input.slice(2)}`;

  return input;
};
