import { Fs, Is, Shell, type t } from './common.ts';
import {
  cleanEnv,
  inspectShell,
  publicProfile,
  type ShellInspectDeps,
  type ShellInspectProfile,
} from './u.inspect.ts';
import { OWNER } from './u.owner.ts';

export type ShellPathDeps = ShellInspectDeps;

type ShellPathAddOptions = t.ShellTool.MutationOptions;

/** PATH catalog and managed-block planning helpers. */
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

/** Plan a PATH add operation without writing shell profile files. */
export async function pathAdd(
  target: t.ShellTool.Path.Target,
  options: ShellPathAddOptions = {},
  deps: ShellPathDeps = {},
): Promise<t.ShellTool.Path.AddReport> {
  const ctx = await inspectContext(deps, options);
  const entries = resolvePaths(target);
  const warnings = [...ctx.warnings];

  if (options.dryRun) warnings.push('No changes written');
  if (!options.dryRun) warnings.push('Dry-run preview only; no changes written');
  if (target === 'deno' && ctx.env.pathContainsDenoBin) {
    warnings.push('Deno install bin is already on PATH; managed block preview still shown');
  }

  const profile = selectProfile(ctx.profiles, options.profile);
  if (!profile) {
    warnings.push('No supported profile target was found; pass --profile <path> to preview a plan');
    return {
      owner: OWNER,
      target,
      entries,
      env: ctx.env,
      profile: undefined,
      plan: undefined,
      warnings,
    };
  }

  const dialect = ctx.shell.dialect;
  if (!dialect) {
    warnings.push('Shell dialect is not supported for PATH block rendering');
    return {
      owner: OWNER,
      target,
      entries,
      env: ctx.env,
      profile: publicProfile(profile),
      plan: undefined,
      warnings,
    };
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

  return {
    owner: OWNER,
    target,
    entries,
    env: ctx.env,
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
  readonly env: t.ShellTool.Doctor.EnvInfo;
  readonly profiles: readonly ShellInspectProfile[];
  readonly warnings: readonly string[];
};

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
    warnings.push('Shell dialect is not supported for managed writes yet');
  }
  if (inspected.profiles.some((profile) => profile.block.kind === 'invalid')) {
    warnings.push('One or more profile files contain invalid @sys/tools shell block markers');
  }
  if (!pathContainsDenoBin) warnings.push('Deno install bin is not currently on PATH');

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
