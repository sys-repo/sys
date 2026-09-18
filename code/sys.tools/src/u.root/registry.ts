import { type t } from './common.ts';

type ToolRegistryItem = {
  readonly id: t.Root.Command;
  readonly label?: string;
  readonly aliases: readonly [string, ...string[]] | undefined;
  readonly displayAliases?: readonly [string, ...string[]] | undefined;
  readonly group: 'primary' | 'secondary' | 'utility';
  readonly load: () => Promise<unknown>;
};

export const ROOT_REGISTRY: readonly ToolRegistryItem[] = [
  {
    id: 'pi',
    aliases: ['agent', 'harness'],
    group: 'primary',
    load: () => import('../cli.pi/mod.ts'),
  },
  { id: 'tmpl', aliases: undefined, group: 'primary', load: () => import('../cli.tmpl/mod.ts') },
  { id: 'pull', aliases: undefined, group: 'primary', load: () => import('../cli.pull/mod.ts') },
  { id: 'serve', aliases: undefined, group: 'primary', load: () => import('../cli.serve/mod.ts') },
  {
    id: 'deploy',
    aliases: undefined,
    group: 'primary',
    load: () => import('../cli.deploy/mod.ts'),
  },
  {
    id: 'shell',
    aliases: undefined,
    group: 'secondary',
    load: () => import('../cli.shell/mod.ts'),
  },
  { id: 'crdt', aliases: undefined, group: 'secondary', load: () => import('../cli.crdt/mod.ts') },
  {
    id: 'video',
    aliases: undefined,
    group: 'secondary',
    load: () => import('../cli.video/mod.ts'),
  },
  {
    id: 'crypto',
    label: 'cryptography',
    aliases: ['crypto'],
    group: 'secondary',
    load: () => import('../cli.crypto/mod.ts'),
  },
  {
    id: 'copy',
    label: 'clipboard',
    aliases: ['cp'],
    group: 'secondary',
    load: () => import('../cli.clipboard/mod.ts'),
  },
  { id: 'upgrade', aliases: ['up'], group: 'utility', load: () => import('../cli.upgrade/mod.ts') },
  { id: 'dsl', aliases: undefined, group: 'secondary', load: () => import('../cli.dsl/mod.ts') },
];

export const TOOL_IDS = ROOT_REGISTRY.map((item) => item.id) as readonly t.Root.Command[];

export const Imports = Object.fromEntries(
  ROOT_REGISTRY.map((item) => [item.id, item.load]),
) as Record<t.Root.Command, () => Promise<unknown>>;

export const ALIAS = ROOT_REGISTRY.reduce((acc, item) => {
  if (!item.aliases) return acc;
  acc[item.id] = item.aliases;
  return acc;
}, {} as t.ArgsAliasMap<t.Root.Command>);
