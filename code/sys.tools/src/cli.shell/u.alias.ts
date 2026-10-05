import { Shell, type t } from './common.ts';
import {
  inspectShell,
  publicProfile,
  type ShellInspectDeps,
  type ShellInspectProfile,
} from './u.inspect.ts';
import {
  backupPath,
  mutationNow,
  mutationWriter,
  profileAftercare,
  type ShellMutationDeps,
  writeProfileUpdate,
} from './u.mutation.ts';
import { OWNER } from './u.owner.ts';

export type ShellAliasDeps = ShellInspectDeps & ShellMutationDeps;

type ShellAliasEnableOptions = t.ShellTool.MutationOptions;

/** Alias catalog and managed-block mutation helpers. */
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

/** Enable aliases in the managed shell block, or preview with `--dry-run`. */
export async function aliasEnable(
  target: t.ShellTool.Alias.Target,
  options: ShellAliasEnableOptions = {},
  deps: ShellAliasDeps = {},
): Promise<t.ShellTool.Alias.EnableReport> {
  const writeText = mutationWriter(deps);
  const now = mutationNow(deps);
  const ctx = await inspectContext(deps, options);
  const entries = resolveAliases(target);
  const warnings = [...ctx.warnings];
  const dryRun = Boolean(options.dryRun);

  const profile = selectProfile(ctx.profiles, options.profile);
  if (!profile) {
    warnings.push('No supported profile target was found; pass --profile <path> to enable aliases');
    return report({ status: 'blocked', dryRun, target, entries, warnings });
  }

  const dialect = ctx.shell.dialect;
  if (!dialect) {
    warnings.push('Shell dialect does not support alias profile edits');
    return report({ status: 'blocked', dryRun, target, entries, profile, warnings });
  }

  if (profile.readError) {
    warnings.push(`Cannot update unreadable profile ${profile.path}`);
    return report({ status: 'blocked', dryRun, target, entries, profile, warnings });
  }

  if (profile.block.kind === 'invalid') {
    warnings.push(`Cannot update invalid managed shell block: ${profile.block.reason}`);
    return report({ status: 'blocked', dryRun, target, entries, profile, warnings });
  }

  const conflicts = entries.filter((entry) => hasUnmanagedAlias(profile, entry.name));
  if (conflicts.length > 0) {
    const names = conflicts.map((entry) => entry.name).join(', ');
    warnings.push(
      `Cannot enable aliases because ${profile.path} contains unmanaged alias/function: ${names}`,
    );
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
  const plan: t.ShellTool.Alias.EnablePlan = {
    kind: planned.kind,
    changed: planned.changed,
    block: planned.block,
    preview,
  };
  warnings.push(...planned.warnings);
  const backup = planned.changed ? backupPath(profile.path, now()) : undefined;

  if (conflicts.length > 0) {
    return report({ status: 'blocked', dryRun, target, entries, profile, backup, plan, warnings });
  }

  if (dryRun) {
    warnings.push('Dry-run preview only; no changes written');
    return report({
      status: planned.changed ? 'planned' : 'unchanged',
      dryRun,
      target,
      entries,
      profile,
      backup,
      plan,
      warnings,
    });
  }

  if (!planned.changed) {
    warnings.push('Managed shell block already up to date; no files written');
    return report({
      status: 'unchanged',
      dryRun,
      target,
      entries,
      profile,
      plan,
      aftercare: profileAftercare(profile, dialect),
      warnings,
    });
  }

  if (!backup) {
    warnings.push('No backup target was created; no files written');
    return report({ status: 'blocked', dryRun, target, entries, profile, plan, warnings });
  }

  const written = await writeProfileUpdate({
    writeText,
    profile,
    backup,
    nextText: planned.nextText,
  });
  if (!written.ok) {
    warnings.push(written.warning);
    return report({ status: 'blocked', dryRun, target, entries, profile, backup, plan, warnings });
  }

  return report({
    status: 'applied',
    dryRun,
    target,
    entries,
    profile,
    backup,
    plan,
    aftercare: profileAftercare(profile, dialect),
    warnings,
  });
}

/**
 * Helpers:
 */
type InspectedContext = {
  readonly shell: t.ShellTool.Doctor.ShellInfo;
  readonly profiles: readonly ShellInspectProfile[];
  readonly warnings: readonly string[];
};

type ReportArgs = {
  readonly status: t.ShellTool.MutationStatus;
  readonly dryRun: boolean;
  readonly target: t.ShellTool.Alias.Target;
  readonly entries: readonly t.ShellTool.Alias.Entry[];
  readonly profile?: ShellInspectProfile;
  readonly backup?: t.StringPath;
  readonly plan?: t.ShellTool.Alias.EnablePlan;
  readonly aftercare?: t.ShellTool.Aftercare;
  readonly warnings: readonly string[];
};

function report(args: ReportArgs): t.ShellTool.Alias.EnableReport {
  return {
    owner: OWNER,
    status: args.status,
    dryRun: args.dryRun,
    target: args.target,
    entries: args.entries,
    profile: args.profile ? publicProfile(args.profile) : undefined,
    backup: args.backup,
    plan: args.plan,
    aftercare: args.aftercare,
    warnings: args.warnings,
  };
}

async function inspectContext(
  deps: ShellAliasDeps,
  options: ShellAliasEnableOptions = {},
): Promise<InspectedContext> {
  const inspected = await inspectShell(deps, { profile: options.profile, shell: options.shell });
  const warnings = [...inspected.warnings];

  if (!inspected.home && !options.profile) {
    warnings.push('HOME is not set; pass --profile <path> to preview a plan');
  }
  if (!inspected.shell.dialect) {
    warnings.push('Shell dialect supports doctor only; profile edits are unavailable');
  }
  if (inspected.profiles.some((profile) => profile.block.kind === 'invalid')) {
    warnings.push('One or more profile files contain invalid @sys/tools shell block markers');
  }

  return { shell: inspected.shell, profiles: inspected.profiles, warnings };
}

function aliasState(
  entry: t.ShellTool.Alias.Entry,
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

function hasManagedAlias(profile: ShellInspectProfile, entry: t.ShellTool.Alias.Entry): boolean {
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

function resolveAliases(target: t.ShellTool.Alias.Target): readonly t.ShellTool.Alias.Entry[] {
  return Shell.Alias.group(target);
}

function mergeAliases(
  existing: readonly t.ShellTool.Alias.Entry[],
  next: readonly t.ShellTool.Alias.Entry[],
): readonly t.ShellTool.Alias.Entry[] {
  const map = new Map<string, t.ShellTool.Alias.Entry>();
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
