import { type t, c, pkg } from './common.ts';
import { ROOT_REGISTRY } from './registry.ts';

export type RootRow = { readonly command: t.Root.Command; readonly columns: string[] };
export type RootRowGroup = 'primary' | 'secondary' | 'utility';

export function rootRows(group?: RootRowGroup): RootRow[] {
  const fmt = (tool: string) => c.gray(c.dim(`${pkg.name} `)) + tool;
  const rows: RootRow[] = [];

  const add = (command: t.Root.Command, label?: string, alias?: readonly string[]) => {
    const items = [fmt(label ?? command)];
    const displayAliases = alias?.filter((item) => item !== command && item !== label);
    if (displayAliases?.length) items.push(fmtAliases(displayAliases));
    rows.push({ command, columns: items });
  };

  ROOT_REGISTRY
    .filter((item) => group === undefined || item.group === group)
    .forEach((item) => add(item.id, 'label' in item ? item.label : undefined, item.aliases));

  return rows;
}

function fmtAliases(aliases: readonly string[]) {
  const label = aliases.length === 1 ? 'alias' : 'aliases';
  return c.gray(`(← ${label} ${c.white(aliases.join(', '))})`);
}
