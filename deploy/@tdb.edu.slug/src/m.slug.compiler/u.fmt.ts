import { type t, Crdt, c, Cli } from './common.ts';

export const Fmt = {
  Tree: Cli.Fmt.Tree,

  /**
   * Common format for text in a waiting spinner.
   */
  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  prettyUri(input: t.Crdt.Id) {
    const id = Crdt.Id.clean(input) ?? input;
    const pretty = `${id.slice(0, -5)}${c.green(id.slice(-5))}`;
    return `crdt:${pretty}`;
  },

  prettyPath(path: t.StringPath, highlightLevels = 1) {
    const parts = path.split('/');
    const start = parts.slice(0, -highlightLevels);
    const end = parts.slice(-highlightLevels);
    return c.gray(`${start.join('/')}/${c.cyan(end.join('/'))}`);
  },
} as const;
