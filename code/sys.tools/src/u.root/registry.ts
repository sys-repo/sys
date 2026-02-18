import { type t } from './common.ts';

type ToolRegistryItem = {
  readonly id: t.Tools.Command;
  readonly aliases: readonly [string, ...string[]] | undefined;
  readonly load: () => Promise<unknown>;
};

export const ROOT_REGISTRY = [
  { id: 'copy', aliases: ['cp'], load: () => import('../cli.clipboard/mod.ts') },
  { id: 'crdt', aliases: undefined, load: () => import('../cli.crdt/mod.ts') },
  { id: 'pull', aliases: undefined, load: () => import('../cli.pull/mod.ts') },
  { id: 'serve', aliases: undefined, load: () => import('../cli.serve/mod.ts') },
  { id: 'deploy', aliases: undefined, load: () => import('../cli.deploy/mod.ts') },
  { id: 'video', aliases: undefined, load: () => import('../cli.video/mod.ts') },
  { id: 'update', aliases: ['up'], load: () => import('../cli.update/mod.ts') },
] as const satisfies readonly ToolRegistryItem[];

export const TOOL_IDS = ROOT_REGISTRY.map((item) => item.id) as readonly t.Tools.Command[];

export const Imports = Object.fromEntries(
  ROOT_REGISTRY.map((item) => [item.id, item.load]),
) as Record<t.Tools.Command, () => Promise<unknown>>;

export const ALIAS = ROOT_REGISTRY.reduce((acc, item) => {
  if (!item.aliases) return acc;
  acc[item.id] = item.aliases;
  return acc;
}, {} as t.ArgsAliasMap<t.Tools.Command>);
