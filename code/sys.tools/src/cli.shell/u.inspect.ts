import { Fs, Is, Shell, type t } from './common.ts';
import { OWNER } from './u.owner.ts';

export type ShellInspectDeps = {
  readonly env?: (name: string) => string | undefined;
  readonly exists?: (path: t.StringPath) => Promise<boolean>;
  readonly readText?: (path: t.StringPath) => Promise<string>;
};

export type ShellInspectOptions = {
  readonly profile?: t.StringPath;
  readonly shell?: t.ShellTool.PosixDialect;
};

export type ShellInspectProfile = t.ShellTool.Doctor.Profile & {
  readonly text: string;
  readonly readError?: string;
};

export type ShellInspectContext = {
  readonly home?: t.StringDir;
  readonly shell: t.ShellTool.Doctor.ShellInfo;
  readonly profiles: readonly ShellInspectProfile[];
  readonly warnings: readonly string[];
};

/** Inspect shell env/profile state without writing profile files. */
export async function inspectShell(
  deps: ShellInspectDeps = {},
  options: ShellInspectOptions = {},
): Promise<ShellInspectContext> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const exists = deps.exists ?? Fs.exists;
  const readText = deps.readText ?? readTextFile;
  const home = cleanEnv(env('HOME')) as t.StringDir | undefined;
  const shellPath = cleanEnv(env('SHELL'));
  const dialect = options.shell ?? dialectOf(shellPath);
  const shell: t.ShellTool.Doctor.ShellInfo = {
    path: shellPath,
    dialect,
    support: dialect ? 'write' : 'doctor-only',
  };
  const inspected = await inspectProfiles({
    home,
    shell,
    explicitProfile: options.profile,
    exists,
    readText,
  });

  return { home, shell, profiles: inspected.profiles, warnings: inspected.warnings };
}

/** Strip profile text from an inspected profile for public reports. */
export function publicProfile(profile: ShellInspectProfile): t.ShellTool.Doctor.Profile {
  return {
    path: profile.path,
    role: profile.role,
    exists: profile.exists,
    block: profile.block,
  };
}

export function cleanEnv(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Helpers:
 */
async function inspectProfiles(args: {
  readonly home?: t.StringDir;
  readonly shell: t.ShellTool.Doctor.ShellInfo;
  readonly explicitProfile?: t.StringPath;
  readonly exists: (path: t.StringPath) => Promise<boolean>;
  readonly readText: (path: t.StringPath) => Promise<string>;
}): Promise<{ readonly profiles: readonly ShellInspectProfile[]; readonly warnings: readonly string[] }> {
  const candidates = args.explicitProfile
    ? [{ role: 'explicit', path: args.explicitProfile }]
    : profileNames(args.shell.dialect).map((item) => ({
      role: item.role,
      path: args.home ? Fs.join(args.home, item.file) as t.StringPath : undefined,
    })).filter((item): item is { readonly role: string; readonly path: t.StringPath } =>
      Is.str(item.path)
    );

  const profiles: ShellInspectProfile[] = [];
  const warnings: string[] = [];
  for (const candidate of candidates) {
    const found = await args.exists(candidate.path);
    let text = '';
    let readError: string | undefined;
    let block: t.ShellTool.BlockState = { kind: 'missing' };

    if (found) {
      try {
        text = await args.readText(candidate.path);
        block = Shell.Block.detect({ owner: OWNER, text });
      } catch (cause) {
        readError = errorMessage(cause);
        warnings.push(`Failed to read profile ${candidate.path}: ${readError}`);
      }
    }

    profiles.push({
      ...candidate,
      exists: found,
      text,
      readError,
      block,
    });
  }

  return { profiles, warnings };
}

async function readTextFile(path: t.StringPath): Promise<string> {
  const read = await Fs.readText(path);
  if (read.error) throw read.error;
  return read.data ?? '';
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

function errorMessage(cause: unknown): string {
  if (Is.errorLike(cause)) return String(cause.message ?? 'unknown error');
  return String(cause);
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
