import { type t, c, pkg } from './common.ts';
import { ROOT_REGISTRY } from './registry.ts';

export type RootRow = { readonly command: t.Root.Command; readonly columns: string[] };

export function rootRows(): RootRow[] {
  const fmt = (tool: string) => c.gray(c.dim(`${pkg.name} `)) + tool;
  const rows: RootRow[] = [];

  const add = (command: t.Root.Command, label?: string, alias?: readonly string[]) => {
    const items = [fmt(label ?? command)];
    if (alias) items.push(c.gray(`(← alias ${c.white(alias.join(', '))})`));
    rows.push({ command, columns: items });
  };

  ROOT_REGISTRY.forEach((item) => add(item.id, item.label, item.aliases));

  return rows;
}
