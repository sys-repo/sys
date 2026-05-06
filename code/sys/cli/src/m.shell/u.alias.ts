import { type t } from './common.ts';

const ALIASES: readonly t.Shell.AliasEntry[] = [
  {
    id: 'sys',
    name: 'sys',
    command: 'deno run -A jsr:@sys/tools',
    risk: 'safe',
  },
];

const GROUPS: Readonly<Record<t.Shell.Alias.GroupId, readonly t.Shell.AliasId[]>> = {
  sys: ['sys'],
  common: ['sys'],
};

/** Alias catalog helpers. */
export const Alias: t.Shell.Alias.Lib = {
  list: () => ALIASES,
  get: (id) => ALIASES.find((entry) => entry.id === id),
  group: (id) => GROUPS[id].map((aliasId) => Alias.get(aliasId)).filter((entry) => entry !== undefined),
};
