import { type t, c, pkg } from './common.ts';
import { ROOT_REGISTRY } from './registry.ts';

export type RootRow = { readonly command: t.Root.Command; readonly columns: string[] };
export type RootRowGroup = 'primary' | 'secondary' | 'utility';

type RootRowOptions = {
  readonly highlightCommand?: t.Root.Command;
};

export function rootRows(group?: RootRowGroup, options: RootRowOptions = {}): RootRow[] {
  const fmt = (command: t.Root.Command, tool: string) => {
    const label = options.highlightCommand === command ? c.cyan(tool) : tool;
    return c.gray(c.dim(`${pkg.name} `)) + label;
  };
  const rows: RootRow[] = [];

  const add = (
    command: t.Root.Command,
    label?: string,
    alias?: readonly string[],
    displayAlias?: readonly string[],
  ) => {
    const items = [fmt(command, label ?? command)];
    const displayAliases = displayAlias ?? alias?.filter((item) => item !== command && item !== label);
    if (displayAliases?.length) items.push(fmtAliases(displayAliases));
    rows.push({ command, columns: items });
  };

  ROOT_REGISTRY
    .filter((item) => group === undefined || item.group === group)
    .forEach((item) =>
      add(
        item.id,
        item.label,
        item.aliases,
        item.displayAliases,
      )
    );

  return rows;
}

function fmtAliases(aliases: readonly string[]) {
  const label = aliases.length === 1 ? 'alias' : 'aliases';
  return c.gray(`(← ${label} ${c.white(aliases.join(', '))})`);
}
