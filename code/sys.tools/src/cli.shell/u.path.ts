import { Fs, Is, Shell, type t } from './common.ts';
import {
  cleanEnv,
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

export type ShellPathDeps = ShellInspectDeps & ShellMutationDeps;

type ShellPathAddOptions = t.ShellTool.MutationOptions;

/** PATH catalog and managed-block mutation helpers. */
export const Path = {
  list: pathList,
  add: pathAdd,
} satisfies t.ShellTool.Path.Lib;

/** Inspect the managed PATH catalog and profile-managed PATH state. */
export async function pathList(
  deps: ShellPathDeps = {},
): Promise<t.ShellTool.Path.ListReport> {
  const ctx = await inspectContext(deps);
  const items = Shell.Path.list().map((entry) => pathState(entry, ctx.profiles, ctx.env));

  return {
    owner: OWNER,
    shell: ctx.shell,
    env: ctx.env,
    profiles: ctx.profiles.map(publicProfile),
    items,
    warnings: ctx.warnings,
  };
}

/** Add PATH entries in the managed shell block, or preview with `--dry-run`. */
export async function pathAdd(
  target: t.ShellTool.Path.Target,
  options: ShellPathAddOptions = {},
  deps: ShellPathDeps = {},
): Promise<t.ShellTool.Path.AddReport> {
  const writeText = mutationWriter(deps);
  const now = mutationNow(deps);
  const ctx = await inspectContext(deps, options);
  const entries = resolvePaths(target);
  const warnings = [...ctx.warnings];
  const dryRun = Boolean(options.dryRun);

  if (target === 'deno' && ctx.env.pathContainsDenoBin) {
    warnings.push('Deno bin is already on PATH; managed block still shown');
  }

  const profile = selectProfile(ctx.profiles, options.profile);
  if (!profile) {
    warnings.push(
      'No supported profile target was found; pass --profile <path> to add PATH entries',
    );
    return report({ status: 'blocked', dryRun, target, entries, env: ctx.env, warnings });
  }

  const dialect = ctx.shell.dialect;
  if (!dialect) {
    warnings.push('Shell dialect does not support PATH profile edits');
    return report({ status: 'blocked', dryRun, target, entries, env: ctx.env, profile, warnings });
  }

  if (profile.readError) {
    warnings.push(`Cannot update unreadable profile ${profile.path}`);
    return report({ status: 'blocked', dryRun, target, entries, env: ctx.env, profile, warnings });
  }

  if (profile.block.kind === 'invalid') {
    warnings.push(`Cannot update invalid managed shell block: ${profile.block.reason}`);
    return report({ status: 'blocked', dryRun, target, entries, env: ctx.env, profile, warnings });
  }

  const existing = profile.block.kind === 'present'
    ? profile.block.model
    : { aliases: [], paths: [] };
  const model = {
    aliases: existing.aliases,
    paths: mergePaths(existing.paths, entries),
  };
  const planned = Shell.Block.update({
    owner: OWNER,
    dialect,
    text: profile.text,
    model,
  });
  const preview = Shell.Block.render({ owner: OWNER, dialect, model });
  const plan: t.ShellTool.Path.AddPlan = {
    kind: planned.kind,
    changed: planned.changed,
    block: planned.block,
    preview,
  };
  warnings.push(...planned.warnings);
  const backup = planned.changed ? backupPath(profile.path, now()) : undefined;

  if (dryRun) {
    warnings.push('Dry-run preview only; no changes written');
    return report({
      status: planned.changed ? 'planned' : 'unchanged',
      dryRun,
      target,
      entries,
      env: ctx.env,
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
      env: ctx.env,
      profile,
      plan,
      aftercare: profileAftercare(profile, dialect),
      warnings,
    });
  }

  if (!backup) {
    warnings.push('No backup target was created; no files written');
    return report({
      status: 'blocked',
      dryRun,
      target,
      entries,
      env: ctx.env,
      profile,
      plan,
      warnings,
    });
  }

  const written = await writeProfileUpdate({
    writeText,
    profile,
    backup,
    nextText: planned.nextText,
  });
  if (!written.ok) {
    warnings.push(written.warning);
    return report({
      status: 'blocked',
      dryRun,
      target,
      entries,
      env: ctx.env,
      profile,
      backup,
      plan,
      warnings,
    });
  }

  return report({
    status: 'applied',
    dryRun,
    target,
    entries,
    env: ctx.env,
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
  readonly env: t.ShellTool.Doctor.EnvInfo;
  readonly profiles: readonly ShellInspectProfile[];
  readonly warnings: readonly string[];
};

type ReportArgs = {
  readonly status: t.ShellTool.MutationStatus;
  readonly dryRun: boolean;
  readonly target: t.ShellTool.Path.Target;
  readonly entries: readonly t.ShellTool.Path.Entry[];
  readonly env: t.ShellTool.Doctor.EnvInfo;
  readonly profile?: ShellInspectProfile;
  readonly backup?: t.StringPath;
  readonly plan?: t.ShellTool.Path.AddPlan;
  readonly aftercare?: t.ShellTool.Aftercare;
  readonly warnings: readonly string[];
};

function report(args: ReportArgs): t.ShellTool.Path.AddReport {
  return {
    owner: OWNER,
    status: args.status,
    dryRun: args.dryRun,
    target: args.target,
    entries: args.entries,
    env: args.env,
    profile: args.profile ? publicProfile(args.profile) : undefined,
    backup: args.backup,
    plan: args.plan,
    aftercare: args.aftercare,
    warnings: args.warnings,
  };
}

async function inspectContext(
  deps: ShellPathDeps,
  options: ShellPathAddOptions = {},
): Promise<InspectedContext> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const inspected = await inspectShell(deps, { profile: options.profile, shell: options.shell });
  const denoInstall = resolveDenoInstall(inspected.home, env('DENO_INSTALL'));
  const denoBin = denoInstall ? Fs.join(denoInstall, 'bin') as t.StringDir : undefined;
  const pathContainsDenoBin = Is.str(denoBin) && pathIncludes(env('PATH'), denoBin);
  const envInfo = {
    home: inspected.home,
    denoInstall,
    denoBin,
    pathContainsDenoBin,
  };
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
  if (!pathContainsDenoBin) warnings.push('Deno bin is not currently on PATH');

  return { shell: inspected.shell, env: envInfo, profiles: inspected.profiles, warnings };
}

function pathState(
  entry: t.ShellTool.Path.Entry,
  profiles: readonly ShellInspectProfile[],
  env: t.ShellTool.Doctor.EnvInfo,
): t.ShellTool.Path.Item {
  const enabledProfiles = profiles.filter((profile) => hasManagedPath(profile, entry));
  const unmanagedProfiles = profiles.filter((profile) => hasUnmanagedPath(profile, entry));
  const staleProfiles = enabledProfiles.filter((profile) =>
    profile.block.kind === 'present' && profile.block.stale
  );

  const state: t.ShellTool.Path.State = enabledProfiles.length > 0
    ? 'enabled'
    : unmanagedProfiles.length > 0 || (entry.id === 'deno' && env.pathContainsDenoBin)
    ? 'present'
    : 'missing';

  return {
    entry,
    state,
    profiles: enabledProfiles.map((profile) => profile.path),
    unmanagedProfiles: unmanagedProfiles.map((profile) => profile.path),
    stale: staleProfiles.length > 0,
  };
}

function hasManagedPath(profile: ShellInspectProfile, entry: t.ShellTool.Path.Entry): boolean {
  if (profile.block.kind !== 'present') return false;
  return profile.block.model.paths.some((path) =>
    path.id === entry.id && path.expression === entry.expression
  );
}

function hasUnmanagedPath(profile: ShellInspectProfile, entry: t.ShellTool.Path.Entry): boolean {
  if (entry.id !== 'deno' || !profile.exists || profile.text.length === 0) return false;
  const unmanaged = Shell.Block.remove({ owner: OWNER, text: profile.text }).nextText;
  return denoPathExpressions().some((expr) => expr.test(unmanaged));
}

function resolvePaths(target: t.ShellTool.Path.Target): readonly t.ShellTool.Path.Entry[] {
  const entry = Shell.Path.get(target);
  return entry ? [entry] : [];
}

function mergePaths(
  existing: readonly t.ShellTool.Path.Entry[],
  next: readonly t.ShellTool.Path.Entry[],
): readonly t.ShellTool.Path.Entry[] {
  const map = new Map<string, t.ShellTool.Path.Entry>();
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

function resolveDenoInstall(
  home: t.StringDir | undefined,
  value?: string,
): t.StringDir | undefined {
  const explicit = cleanEnv(value);
  if (explicit) return explicit as t.StringDir;
  if (!home) return undefined;
  return Fs.join(home, '.deno') as t.StringDir;
}

function pathIncludes(pathEnv: string | undefined, target: string): boolean {
  return (pathEnv ?? '').split(':').includes(target);
}

function denoPathExpressions(): readonly RegExp[] {
  return [
    /\$DENO_INSTALL\/bin/,
    /\$\{DENO_INSTALL\}\/bin/,
    /\$HOME\/\.deno\/bin/,
    /~\/\.deno\/bin/,
  ];
}
