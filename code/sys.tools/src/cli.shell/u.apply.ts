import { Fs, Is, Shell, type t } from './common.ts';
import {
  cleanEnv,
  inspectShell,
  publicProfile,
  type ShellInspectContext,
  type ShellInspectDeps,
  type ShellInspectProfile,
} from './u.inspect.ts';
import {
  backupPath,
  mutationNow,
  mutationWriter,
  profileAftercare,
  type ShellMutationDeps,
  shellSingleQuote,
  writeProfileUpdate,
} from './u.mutation.ts';
import { OWNER } from './u.owner.ts';

export type ShellApplyDeps = ShellInspectDeps & ShellMutationDeps;

/** Plan or initialize the recommended managed shell baseline. */
export async function apply(
  options: t.ShellTool.Apply.Options = {},
  deps: ShellApplyDeps = {},
): Promise<t.ShellTool.Apply.Report> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const exists = deps.exists ?? Fs.exists;
  const writeText = mutationWriter(deps);
  const now = mutationNow(deps);
  const inspected = await inspectShell(deps, { profile: options.profile, shell: options.shell });
  const envInfo = await inspectEnv(inspected.home, env, exists);
  const shell = inspected.shell;
  const aliases = Shell.Alias.group('sys');
  const paths = recommendedPaths(envInfo);
  const warnings = initialWarnings(options, inspected, envInfo, paths);
  const profile = selectProfile(inspected.profiles, shell, options.profile, warnings);
  const dryRun = Boolean(options.dryRun);

  if (!profile) {
    warnings.push(
      'No supported profile target was found; pass --profile <path> to initialize shell baseline',
    );
    return report({
      status: 'blocked',
      dryRun,
      shell,
      env: envInfo.public,
      aliases,
      paths,
      warnings,
    });
  }

  if (!shell.dialect) {
    warnings.push('Shell dialect does not support baseline profile edits');
    return report({
      status: 'blocked',
      dryRun,
      shell,
      env: envInfo.public,
      aliases,
      paths,
      profile,
      warnings,
    });
  }

  if (profile.readError) {
    warnings.push(`Cannot update unreadable profile ${profile.path}`);
    return report({
      status: 'blocked',
      dryRun,
      shell,
      env: envInfo.public,
      aliases,
      paths,
      profile,
      warnings,
    });
  }

  if (profile.block.kind === 'invalid') {
    warnings.push(`Cannot update invalid managed shell block: ${profile.block.reason}`);
    return report({
      status: 'blocked',
      dryRun,
      shell,
      env: envInfo.public,
      aliases,
      paths,
      profile,
      warnings,
    });
  }

  const conflicts = aliases.filter((entry) => hasUnmanagedAlias(profile, entry.name));
  if (conflicts.length > 0) {
    const names = conflicts.map((entry) => entry.name).join(', ');
    const msg =
      `Cannot initialize because ${profile.path} contains unmanaged alias/function: ${names}`;
    warnings.push(msg);
  }

  const existing = profile.block.kind === 'present'
    ? profile.block.model
    : { aliases: [], paths: [] };
  const model = {
    aliases: mergeAliases(existing.aliases, aliases),
    paths: mergePaths(existing.paths, paths),
  };
  const planned = Shell.Block.update({
    owner: OWNER,
    dialect: shell.dialect,
    text: profile.text,
    model,
  });
  const plan: t.ShellTool.Apply.Plan = {
    kind: planned.kind,
    changed: planned.changed,
    block: planned.block,
    preview: Shell.Block.render({ owner: OWNER, dialect: shell.dialect, model }),
  };
  warnings.push(...planned.warnings);
  const backup = planned.changed ? backupPath(profile.path, now()) : undefined;

  const blocked = isBlocked(conflicts.length > 0, warnings);
  if (blocked) {
    return report({
      status: 'blocked',
      dryRun,
      shell,
      env: envInfo.public,
      aliases,
      paths,
      profile,
      backup,
      plan,
      warnings,
    });
  }

  if (dryRun) {
    warnings.push('No files written');
    if (planned.changed) warnings.push(`Initialize with: ${initCommand(options)}`);
    return report({
      status: planned.changed ? 'planned' : 'unchanged',
      dryRun: true,
      shell,
      env: envInfo.public,
      aliases,
      paths,
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
      dryRun: false,
      shell,
      env: envInfo.public,
      aliases,
      paths,
      profile,
      plan,
      aftercare: profileAftercare(profile, shell.dialect),
      warnings,
    });
  }

  if (!backup) {
    warnings.push('No backup target was created; no files written');
    return report({
      status: 'blocked',
      dryRun: false,
      shell,
      env: envInfo.public,
      aliases,
      paths,
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
      dryRun: false,
      shell,
      env: envInfo.public,
      aliases,
      paths,
      profile,
      backup,
      plan,
      warnings,
    });
  }

  return report({
    status: 'applied',
    dryRun: false,
    shell,
    env: envInfo.public,
    aliases,
    paths,
    profile,
    backup,
    plan,
    aftercare: profileAftercare(profile, shell.dialect),
    warnings,
  });
}

/** Initialize the recommended managed shell baseline. */
export const init = apply;

/**
 * Helpers:
 */
type EnvContext = {
  readonly public: t.ShellTool.Doctor.EnvInfo;
  readonly denoInstallExplicit: boolean;
  readonly denoBinExists: boolean;
};

type ReportArgs = {
  readonly status: t.ShellTool.Apply.Status;
  readonly dryRun: boolean;
  readonly shell: t.ShellTool.Doctor.ShellInfo;
  readonly env: t.ShellTool.Doctor.EnvInfo;
  readonly aliases: readonly t.ShellTool.Alias.Entry[];
  readonly paths: readonly t.ShellTool.Path.Entry[];
  readonly profile?: ShellInspectProfile;
  readonly backup?: t.StringPath;
  readonly plan?: t.ShellTool.Apply.Plan;
  readonly aftercare?: t.ShellTool.Apply.Aftercare;
  readonly warnings: readonly string[];
};

async function inspectEnv(
  home: t.StringDir | undefined,
  env: (name: string) => string | undefined,
  exists: (path: t.StringPath) => Promise<boolean>,
): Promise<EnvContext> {
  const denoInstallEnv = cleanEnv(env('DENO_INSTALL'));
  const denoInstall = denoInstallEnv ?? (home ? Fs.join(home, '.deno') : undefined);
  const denoBin = denoInstall ? Fs.join(denoInstall, 'bin') as t.StringDir : undefined;
  const pathContainsDenoBin = Is.str(denoBin) && pathIncludes(env('PATH'), denoBin);
  const denoBinExists = Is.str(denoBin) ? await exists(denoBin) : false;

  return {
    public: {
      home,
      denoInstall: denoInstall as t.StringDir | undefined,
      denoBin,
      pathContainsDenoBin,
    },
    denoInstallExplicit: Is.str(denoInstallEnv),
    denoBinExists,
  };
}

function initialWarnings(
  options: t.ShellTool.Apply.Options,
  inspected: ShellInspectContext,
  env: EnvContext,
  paths: readonly t.ShellTool.Path.Entry[],
): string[] {
  const warnings = [...inspected.warnings];

  if (!inspected.home && !options.profile) {
    warnings.push('HOME is not set; pass --profile <path> to initialize shell baseline');
  }
  if (!inspected.shell.dialect) {
    warnings.push('Shell dialect supports doctor only; profile edits are unavailable');
  }
  if (inspected.profiles.some((profile) => profile.block.kind === 'invalid')) {
    warnings.push('One or more profile files contain invalid @sys/tools shell block markers');
  }
  if (paths.length === 0) {
    warnings.push('Skipped Deno PATH entry because no trustworthy Deno bin target was found');
  }
  if (!env.public.pathContainsDenoBin) warnings.push('Deno bin is not currently on PATH');

  return warnings;
}

function recommendedPaths(env: EnvContext): readonly t.ShellTool.Path.Entry[] {
  const deno = Shell.Path.get('deno');
  const trustworthy = env.denoInstallExplicit || env.denoBinExists ||
    env.public.pathContainsDenoBin;
  return deno && trustworthy ? [deno] : [];
}

function selectProfile(
  profiles: readonly ShellInspectProfile[],
  shell: t.ShellTool.Doctor.ShellInfo,
  explicit: t.StringPath | undefined,
  warnings: string[],
): ShellInspectProfile | undefined {
  if (explicit) return profiles.find((profile) => profile.path === explicit) ?? profiles[0];
  if (shell.dialect === 'bash') {
    const existing = profiles.filter((profile) => profile.exists);
    if (existing.length === 1) return existing[0];
    if (existing.length > 1) {
      warnings.push(
        `Cannot choose a bash profile safely. Found: ${
          existing.map((profile) => profile.path).join(', ')
        }`,
      );
    } else {
      warnings.push('Cannot choose a bash profile safely; pass --profile <path>');
    }
    return undefined;
  }
  return profiles.find((profile) => profile.role === 'interactive') ?? profiles[0];
}

function isBlocked(
  conflict: boolean,
  warnings: readonly string[],
): boolean {
  if (conflict) return true;
  return warnings.some((warning) => warning.startsWith('Cannot choose a bash profile safely'));
}

function report(args: ReportArgs): t.ShellTool.Apply.Report {
  return {
    owner: OWNER,
    status: args.status,
    dryRun: args.dryRun,
    shell: args.shell,
    env: args.env,
    aliases: args.aliases,
    paths: args.paths,
    profile: args.profile ? publicProfile(args.profile) : undefined,
    backup: args.backup,
    plan: args.plan,
    aftercare: args.aftercare,
    warnings: args.warnings,
  };
}

function hasUnmanagedAlias(profile: ShellInspectProfile, name: string): boolean {
  if (!profile.exists || profile.text.length === 0) return false;
  const unmanaged = Shell.Block.remove({ owner: OWNER, text: profile.text }).nextText;
  return unmanagedConflictExpressions(name).some((expr) => expr.test(unmanaged));
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

function mergePaths(
  existing: readonly t.ShellTool.Path.Entry[],
  next: readonly t.ShellTool.Path.Entry[],
): readonly t.ShellTool.Path.Entry[] {
  const map = new Map<string, t.ShellTool.Path.Entry>();
  existing.forEach((entry) => map.set(entry.id, entry));
  next.forEach((entry) => map.set(entry.id, entry));
  return [...map.values()];
}

function initCommand(options: t.ShellTool.Apply.Options): string {
  const parts = ['sys shell init'];
  if (options.profile) parts.push(`--profile ${shellSingleQuote(options.profile)}`);
  if (options.shell) parts.push(`--shell ${options.shell}`);
  return parts.join(' ');
}

function pathIncludes(pathEnv: string | undefined, target: string): boolean {
  return (pathEnv ?? '').split(':').includes(target);
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
