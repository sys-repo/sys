import { Fs, Is, Shell, type t } from './common.ts';

export type ShellDoctorDeps = {
  readonly env?: (name: string) => string | undefined;
  readonly exists?: (path: t.StringPath) => Promise<boolean>;
  readonly readText?: (path: t.StringPath) => Promise<string>;
};

const OWNER = {
  id: '@sys.shell',
  label: '@sys/tools shell',
  commandHint: 'sys shell ...',
} as const satisfies t.ShellTool.Owner;

/** Run the read-only shell doctor. */
export async function doctor(deps: ShellDoctorDeps = {}): Promise<t.ShellTool.Doctor.Report> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const exists = deps.exists ?? Fs.exists;
  const readText = deps.readText ?? readTextFile;

  const home = cleanEnv(env('HOME')) as t.StringDir | undefined;
  const shellPath = cleanEnv(env('SHELL'));
  const shell = shellInfo(shellPath);
  const denoInstall = resolveDenoInstall(home, env('DENO_INSTALL'));
  const denoBin = denoInstall ? Fs.join(denoInstall, 'bin') as t.StringDir : undefined;
  const pathContainsDenoBin = Is.str(denoBin) && pathIncludes(env('PATH'), denoBin);
  const profiles = await inspectProfiles({ home, shell, exists, readText });
  const warnings = warningsFor({ home, shell, profiles, pathContainsDenoBin });

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
async function inspectProfiles(args: {
  readonly home?: t.StringDir;
  readonly shell: t.ShellTool.Doctor.ShellInfo;
  readonly exists: (path: t.StringPath) => Promise<boolean>;
  readonly readText: (path: t.StringPath) => Promise<string>;
}): Promise<readonly t.ShellTool.Doctor.Profile[]> {
  if (!args.home) return [];

  const home = args.home;
  const candidates = profileNames(args.shell.dialect).map((item) => ({
    role: item.role,
    path: Fs.join(home, item.file) as t.StringPath,
  }));
  const profiles: t.ShellTool.Doctor.Profile[] = [];

  for (const candidate of candidates) {
    const found = await args.exists(candidate.path);
    const text = found ? await args.readText(candidate.path) : '';
    profiles.push({
      ...candidate,
      exists: found,
      block: found ? Shell.Block.detect({ owner: OWNER, text }) : { kind: 'missing' },
    });
  }

  return profiles;
}

async function readTextFile(path: t.StringPath): Promise<string> {
  const read = await Fs.readText(path);
  return read.data ?? '';
}

function shellInfo(shellPath?: string): t.ShellTool.Doctor.ShellInfo {
  const dialect = dialectOf(shellPath);
  return {
    path: shellPath,
    dialect,
    support: dialect ? 'write' : 'doctor-only',
  };
}

function dialectOf(shellPath?: string): t.ShellTool.PosixDialect | undefined {
  const name = basename(shellPath);
  if (name === 'zsh') return 'zsh';
  if (name === 'bash') return 'bash';
  if (name === 'sh') return 'posix';
  return undefined;
}

function basename(path?: string): string | undefined {
  if (!path) return undefined;
  const parts = path.split('/').filter((part) => part.length > 0);
  return parts.at(-1);
}

function profileNames(
  dialect?: t.ShellTool.PosixDialect,
): readonly { readonly file: string; readonly role: string }[] {
  if (dialect === 'zsh') {
    return [
      { file: '.zshrc', role: 'interactive' },
      { file: '.zprofile', role: 'login' },
    ];
  }
  if (dialect === 'bash') {
    return [
      { file: '.bashrc', role: 'interactive' },
      { file: '.bash_profile', role: 'login' },
      { file: '.profile', role: 'posix fallback' },
    ];
  }
  if (dialect === 'posix') return [{ file: '.profile', role: 'login' }];
  return [];
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

function cleanEnv(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
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
  if (!args.shell.dialect) warnings.push('Shell dialect is not supported for managed writes yet');
  if (!args.pathContainsDenoBin) warnings.push('Deno install bin is not currently on PATH');
  if (args.profiles.some((profile) => profile.block.kind === 'invalid')) {
    warnings.push('One or more profile files contain invalid @sys/tools shell block markers');
  }
  if (args.profiles.some((profile) => profile.block.kind === 'present' && profile.block.stale)) {
    warnings.push('One or more managed shell blocks have manual edits');
  }

  return warnings;
}
