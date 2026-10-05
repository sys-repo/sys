import { Fs, Is, Str, type t, Time } from './common.ts';

export type ShellWriteText = (
  path: t.StringPath,
  text: string,
  options?: t.ShellTool.Apply.WriteOptions,
) => Promise<void>;

export type ShellMutationDeps = {
  readonly writeText?: ShellWriteText;
  readonly now?: () => Date;
};

export type ShellWritableProfile = {
  readonly path: t.StringPath;
  readonly text: string;
};

export type WriteProfileUpdateArgs = {
  readonly writeText: ShellWriteText;
  readonly profile: ShellWritableProfile;
  readonly backup: t.StringPath;
  readonly nextText: string;
};

export type WriteProfileUpdateResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly warning: string };

export function mutationWriter(deps: ShellMutationDeps = {}): ShellWriteText {
  return deps.writeText ?? writeTextFile;
}

export function mutationNow(deps: ShellMutationDeps = {}): () => Date {
  return deps.now ?? (() => Time.now.date);
}

export function backupPath(path: t.StringPath, date: Date): t.StringPath {
  return `${path}.sys-tools-shell.${timestamp(date)}.bak` as t.StringPath;
}

export function profileAftercare(
  profile: { readonly path: t.StringPath },
  dialect: t.ShellTool.PosixDialect,
): t.ShellTool.Aftercare {
  return {
    source: `${dialect === 'posix' ? '.' : 'source'} ${shellSingleQuote(profile.path)}`,
    verify: 'sys --help',
  };
}

export async function writeProfileUpdate(
  args: WriteProfileUpdateArgs,
): Promise<WriteProfileUpdateResult> {
  try {
    await args.writeText(args.backup, args.profile.text, { force: false });
  } catch (cause) {
    return { ok: false, warning: `Failed to write backup ${args.backup}: ${errorMessage(cause)}` };
  }

  try {
    await args.writeText(args.profile.path, args.nextText, { force: true });
  } catch (cause) {
    return {
      ok: false,
      warning: `Failed to write profile ${args.profile.path}: ${errorMessage(cause)}`,
    };
  }

  return { ok: true };
}

export function shellSingleQuote(input: string): string {
  return `'${Str.replaceAll(input, /'/g, "'\\''").after}'`;
}

/**
 * Helpers:
 */
async function writeTextFile(
  path: t.StringPath,
  text: string,
  options: t.ShellTool.Apply.WriteOptions = {},
): Promise<void> {
  const result = await Fs.write(path, text, { force: options.force ?? true });
  if (result.error) throw result.error;
}

function timestamp(date: Date): string {
  const yyyy = String(date.getUTCFullYear());
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function errorMessage(cause: unknown): string {
  if (Is.errorLike(cause)) return String(cause.message ?? 'unknown error');
  return String(cause);
}
