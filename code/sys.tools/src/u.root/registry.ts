import { type t } from './common.ts';

type ToolRegistryItem = {
  readonly id: t.Root.Command;
  readonly label?: string;
  readonly aliases: readonly [string, ...string[]] | undefined;
  readonly specifier: string;
};

export const ROOT_REGISTRY = [
  { id: 'code', aliases: undefined, specifier: '../cli.code/mod.ts' },
  { id: 'tmpl', aliases: ['clone'], specifier: '../cli.tmpl/mod.ts' },
  { id: 'pull', aliases: undefined, specifier: '../cli.pull/mod.ts' },
  { id: 'serve', aliases: undefined, specifier: '../cli.serve/mod.ts' },
  { id: 'deploy', aliases: undefined, specifier: '../cli.deploy/mod.ts' },
  { id: 'crdt', aliases: undefined, specifier: '../cli.crdt/mod.ts' },
  { id: 'video', aliases: undefined, specifier: '../cli.video/mod.ts' },
  { id: 'crypto', label: 'cryptography', aliases: ['crypto'], specifier: '../cli.crypto/mod.ts' },
  { id: 'copy', label: 'clipboard', aliases: ['cp'], specifier: '../cli.clipboard/mod.ts' },
  { id: 'update', aliases: ['up', 'info'], specifier: '../cli.update/mod.ts' },
] as const satisfies readonly ToolRegistryItem[];

export const TOOL_IDS = ROOT_REGISTRY.map((item) => item.id) as readonly t.Root.Command[];

export const Imports = Object.fromEntries(
  ROOT_REGISTRY.map((item) => [item.id, () => import(new URL(item.specifier, import.meta.url).href)]),
) as Record<t.Root.Command, () => Promise<unknown>>;

export const ALIAS = ROOT_REGISTRY.reduce((acc, item) => {
  if (!item.aliases) return acc;
  acc[item.id] = item.aliases;
  return acc;
}, {} as t.ArgsAliasMap<t.Root.Command>);
