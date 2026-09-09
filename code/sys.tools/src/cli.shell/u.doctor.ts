import { Fs, Is, Shell, type t } from './common.ts';
import { cleanEnv, inspectShell, publicProfile, type ShellInspectDeps } from './u.inspect.ts';
import { OWNER } from './u.owner.ts';

export type ShellDoctorDeps = ShellInspectDeps;

/** Run the read-only shell doctor. */
export async function doctor(deps: ShellDoctorDeps = {}): Promise<t.ShellTool.Doctor.Report> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const inspected = await inspectShell(deps);
  const home = inspected.home;
  const shell = inspected.shell;
  const denoInstall = resolveDenoInstall(home, env('DENO_INSTALL'));
  const denoBin = denoInstall ? Fs.join(denoInstall, 'bin') as t.StringDir : undefined;
  const pathContainsDenoBin = Is.str(denoBin) && pathIncludes(env('PATH'), denoBin);
  const profiles = inspected.profiles.map(publicProfile);
  const warnings = [
    ...inspected.warnings,
    ...warningsFor({ home, shell, profiles, pathContainsDenoBin }),
  ];

  return {
    owner: OWNER,
    shell,
    env: { home, denoInstall, denoBin, pathContainsDenoBin },
    profiles,
    catalog: {
      aliases: Shell.Alias.group('common'),
      paths: Shell.Path.list(),
    },
    warnings,
  };
}

/**
 * Helpers:
 */
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

function warningsFor(args: {
  readonly home?: t.StringDir;
  readonly shell: t.ShellTool.Doctor.ShellInfo;
  readonly profiles: readonly t.ShellTool.Doctor.Profile[];
  readonly pathContainsDenoBin: boolean;
}): readonly string[] {
  const warnings: string[] = [];

  if (!args.home) warnings.push('HOME is not set; profile discovery is unavailable');
  if (!args.shell.dialect) {
    warnings.push('Shell dialect supports doctor only; profile edits are unavailable');
  }
  if (!args.pathContainsDenoBin) warnings.push('Deno bin is not currently on PATH');
  if (args.profiles.some((profile) => profile.block.kind === 'invalid')) {
    warnings.push('One or more profile files contain invalid @sys/tools shell block markers');
  }
  if (args.profiles.some((profile) => profile.block.kind === 'present' && profile.block.stale)) {
    warnings.push('One or more managed shell blocks have manual edits');
  }

  return warnings;
}
