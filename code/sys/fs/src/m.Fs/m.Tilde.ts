import { type t } from './common.ts';

export const Tilde: t.Fs.TildeLib = {
  expand(input) {
    const home = Deno.env.get('HOME');
    if (!home) return input;

    if (input === '~') return home;
    if (input.startsWith('~/')) return `${home}/${input.slice(2)}`;

    return input;
  },

  collapse(input) {
    const home = Deno.env.get('HOME');
    if (!home) return input;

    // Normalize to avoid double-slash issues.
    const norm = input.replace(/\/+$/, '');

    if (norm === home) return '~';
    if (norm.startsWith(home + '/')) {
      return `~/${norm.slice(home.length + 1)}`;
    }

    return input;
  },
};
