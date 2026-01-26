import { type t, c, pkg } from './common.ts';
import { ALIAS } from './u.args.ts';

export type RootRow = { readonly command: t.Tools.Command; readonly columns: string[] };

export function rootRows(): RootRow[] {
  const fmt = (tool: t.Tools.Command) => c.gray(c.dim(`${pkg.name}/`)) + tool;
  const rows: RootRow[] = [];

  const add = (tool: t.Tools.Command, alias?: readonly string[]) => {
    const items = [fmt(tool)];
    if (alias) items.push(c.gray(`(← alias ${c.white(alias.join(' '))})`));
    rows.push({ command: tool, columns: items });
  };

  add('copy', ALIAS.copy);
  add('crdt');
  add('serve');
  add('deploy');
  add('video');
  add('update', ALIAS.update);

  return rows;
}
