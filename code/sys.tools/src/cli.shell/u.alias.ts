import { Shell, type t } from './common.ts';
import {
  inspectShell,
  publicProfile,
  type ShellInspectDeps,
  type ShellInspectProfile,
} from './u.inspect.ts';
import { OWNER } from './u.owner.ts';

export type ShellAliasDeps = ShellInspectDeps;

export type ShellAliasEnableOptions = {
  readonly dryRun?: boolean;
  readonly apply?: boolean;
  readonly profile?: t.StringPath;
  readonly shell?: t.ShellTool.PosixDialect;
};

/** Alias catalog and managed-block planning helpers. */
export const Alias = {
  list: aliasList,
  enable: aliasEnable,
} satisfies t.ShellTool.Alias.Lib;

/** Inspect the managed alias catalog and profile-managed alias state. */
export async function aliasList(
  deps: ShellAliasDeps = {},
): Promise<t.ShellTool.Alias.ListReport> {
  const ctx = await inspectContext(deps);
  const items = Shell.Alias.list().map((entry) => aliasState(entry, ctx.profiles));

  return {
    owner: OWNER,
    shell: ctx.shell,
    profiles: ctx.profiles.map(publicProfile),
    items,
    warnings: ctx.warnings,
  };
}

/** Plan an alias enable operation without writing shell profile files. */
export async function aliasEnable(
  target: t.ShellTool.Alias.Target,
  options: ShellAliasEnableOptions = {},
  deps: ShellAliasDeps = {},
): Promise<t.ShellTool.Alias.EnableReport> {
  const ctx = await inspectContext(deps, options);
  const entries = resolveAliases(target);
  const warnings = [...ctx.warnings];

  if (options.apply) {
    warnings.push('Profile writes are not enabled in this command yet; no changes written');
  }
  if (!options.dryRun && !options.apply) warnings.push('Dry-run preview only; no changes written');

  const profile = selectProfile(ctx.profiles, options.profile);
  if (!profile) {
    warnings.push('No supported profile target was found; pass --profile <path> to preview a plan');
    return { owner: OWNER, target, entries, profile: undefined, plan: undefined, warnings };
  }

  const dialect = ctx.shell.dialect;
  if (!dialect) {
    warnings.push('Shell dialect is not supported for alias block rendering');
    return {
      owner: OWNER,
      target,
      entries,
      profile: publicProfile(profile),
      plan: undefined,
      warnings,
    };
  }

  const existing = profile.block.kind === 'present'
    ? profile.block.model
    : { aliases: [], paths: [] };
  const model = {
    aliases: mergeAliases(existing.aliases, entries),
    paths: existing.paths,
  };
  const planned = Shell.Block.update({
    owner: OWNER,
    dialect,
    text: profile.text,
    model,
  });
  const preview = Shell.Block.render({ owner: OWNER, dialect, model });

  return {
    owner: OWNER,
    target,
    entries,
    profile: publicProfile(profile),
    plan: {
      kind: planned.kind,
      changed: planned.changed,
      block: planned.block,
      preview,
    },
    warnings: [...warnings, ...planned.warnings],
  };
}

/**
 * Helpers:
 */
type InspectedContext = {
  readonly shell: t.ShellTool.Doctor.ShellInfo;
  readonly profiles: readonly ShellInspectProfile[];
  readonly warnings: readonly string[];
};

async function inspectContext(
  deps: ShellAliasDeps,
  options: ShellAliasEnableOptions = {},
): Promise<InspectedContext> {
  const inspected = await inspectShell(deps, { profile: options.profile, shell: options.shell });
  const warnings: string[] = [];

  if (!inspected.home && !options.profile) {
    warnings.push('HOME is not set; pass --profile <path> to preview a plan');
  }
  if (!inspected.shell.dialect) {
    warnings.push('Shell dialect is not supported for managed writes yet');
  }
  if (inspected.profiles.some((profile) => profile.block.kind === 'invalid')) {
    warnings.push('One or more profile files contain invalid @sys/tools shell block markers');
  }

  return { shell: inspected.shell, profiles: inspected.profiles, warnings };
}

function aliasState(
  entry: t.ShellTool.AliasEntry,
  profiles: readonly ShellInspectProfile[],
): t.ShellTool.Alias.Item {
  const enabledProfiles = profiles.filter((profile) => hasManagedAlias(profile, entry));
  const conflictProfiles = profiles.filter((profile) => hasUnmanagedAlias(profile, entry.name));
  const staleProfiles = enabledProfiles.filter((profile) =>
    profile.block.kind === 'present' && profile.block.stale
  );

  const state: t.ShellTool.Alias.State = enabledProfiles.length > 0
    ? 'enabled'
    : conflictProfiles.length > 0
    ? 'conflict'
    : 'missing';

  return {
    entry,
    state,
    profiles: enabledProfiles.map((profile) => profile.path),
    conflictProfiles: conflictProfiles.map((profile) => profile.path),
    stale: staleProfiles.length > 0,
  };
}

function hasManagedAlias(profile: ShellInspectProfile, entry: t.ShellTool.AliasEntry): boolean {
  if (profile.block.kind !== 'present') return false;
  return profile.block.model.aliases.some((alias) =>
    alias.id === entry.id && alias.name === entry.name && alias.command === entry.command
  );
}

function hasUnmanagedAlias(profile: ShellInspectProfile, name: string): boolean {
  if (!profile.exists || profile.text.length === 0) return false;
  const unmanaged = Shell.Block.remove({ owner: OWNER, text: profile.text }).nextText;
  return unmanagedConflictExpressions(name).some((expr) => expr.test(unmanaged));
}

function resolveAliases(target: t.ShellTool.Alias.Target): readonly t.ShellTool.AliasEntry[] {
  return Shell.Alias.group(target);
}

function mergeAliases(
  existing: readonly t.ShellTool.AliasEntry[],
  next: readonly t.ShellTool.AliasEntry[],
): readonly t.ShellTool.AliasEntry[] {
  const map = new Map<string, t.ShellTool.AliasEntry>();
  existing.forEach((entry) => map.set(entry.id, entry));
  next.forEach((entry) => map.set(entry.id, entry));
  return [...map.values()];
}

function selectProfile(
  profiles: readonly ShellInspectProfile[],
  explicit?: t.StringPath,
): ShellInspectProfile | undefined {
  if (explicit) return profiles.find((profile) => profile.path === explicit);
  return profiles.find((profile) => profile.role === 'interactive') ?? profiles[0];
}

function unmanagedConflictExpressions(name: string): readonly RegExp[] {
  const escaped = escapeRegExp(name);
  return [
    new RegExp(`^\\s*alias\\s+${escaped}=`, 'm'),
    new RegExp(`^\\s*function\\s+${escaped}(?:\\s|\\(|\\{)`, 'm'),
    new RegExp(`^\\s*${escaped}\\s*\\(\\s*\\)`, 'm'),
  ];
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
