import { type t, c, pkg } from './common.ts';
import { ROOT_REGISTRY } from './registry.ts';

export type RootRow = { readonly command: t.Tools.Command; readonly columns: string[] };

export function rootRows(): RootRow[] {
  const fmt = (tool: t.Tools.Command) => c.gray(c.dim(`${pkg.name} `)) + tool;
  const rows: RootRow[] = [];

  const add = (tool: t.Tools.Command, alias?: readonly string[]) => {
    const items = [fmt(tool)];
    if (alias) items.push(c.gray(`(← alias ${c.white(alias.join(' '))})`));
    rows.push({ command: tool, columns: items });
  };

  ROOT_REGISTRY.forEach((item) => add(item.id, item.aliases));

  return rows;
}
