import { type t } from './common.ts';

type ToolRegistryItem = {
  readonly id: t.Root.Command;
  readonly label?: string;
  readonly aliases: readonly [string, ...string[]] | undefined;
  readonly displayAliases?: readonly [string, ...string[]] | undefined;
  readonly group: 'primary' | 'secondary' | 'utility';
  readonly specifier: string;
};

export const ROOT_REGISTRY: readonly ToolRegistryItem[] = [
  { id: 'pi', aliases: ['agent'], group: 'primary', specifier: '../cli.pi/mod.ts' },
  { id: 'tmpl', aliases: undefined, group: 'primary', specifier: '../cli.tmpl/mod.ts' },
  { id: 'pull', aliases: undefined, group: 'primary', specifier: '../cli.pull/mod.ts' },
  { id: 'serve', aliases: undefined, group: 'primary', specifier: '../cli.serve/mod.ts' },
  { id: 'deploy', aliases: undefined, group: 'primary', specifier: '../cli.deploy/mod.ts' },
  { id: 'crdt', aliases: undefined, group: 'secondary', specifier: '../cli.crdt/mod.ts' },
  { id: 'video', aliases: undefined, group: 'secondary', specifier: '../cli.video/mod.ts' },
  { id: 'crypto', label: 'cryptography', aliases: ['crypto'], group: 'secondary', specifier: '../cli.crypto/mod.ts' },
  { id: 'copy', label: 'clipboard', aliases: ['cp'], group: 'secondary', specifier: '../cli.clipboard/mod.ts' },
  { id: 'update', aliases: ['up', 'info'], group: 'utility', specifier: '../cli.update/mod.ts' },
] as const;

export const TOOL_IDS = ROOT_REGISTRY.map((item) => item.id) as readonly t.Root.Command[];

export const Imports = Object.fromEntries(
  ROOT_REGISTRY.map((item) => [item.id, () => import(new URL(item.specifier, import.meta.url).href)]),
) as Record<t.Root.Command, () => Promise<unknown>>;

export const ALIAS = ROOT_REGISTRY.reduce((acc, item) => {
  if (!item.aliases) return acc;
  acc[item.id] = item.aliases;
  return acc;
}, {} as t.ArgsAliasMap<t.Root.Command>);
