import { Err, Process, type t } from './common.ts';

export type Invoke = typeof Process.invoke;
export type SharedInput = t.DenoVersion.Input | t.DenoVersion.Upgrade.Input;
export type Deps = {
  readonly invoke?: Invoke;
};

export async function invoke(
  input: SharedInput,
  args: readonly string[],
  deps: Deps = {},
): Promise<t.DenoVersion.Output> {
  const cmd = input.cmd ?? 'deno';
  const output = await (deps.invoke ?? Process.invoke)({
    cmd,
    args: [...args],
    cwd: input.cwd,
    env: input.env,
    silent: true,
  });

  return {
    cmd,
    args: [...args],
    code: output.code,
    success: output.success,
    signal: output.signal,
    stdout: output.stdout,
    stderr: output.stderr,
    text: output.text,
    toString: output.toString,
  };
}

export function toUpgradeArgs(input: t.DenoVersion.Upgrade.Input): string[] {
  const args = ['upgrade'];

  if (input.dryRun) args.push('--dry-run');
  if (input.force) args.push('--force');
  if (input.quiet) args.push('--quiet');
  if (input.outputPath) args.push('--output', input.outputPath);
  args.push(...toTargetArgs(input.target));

  return args;
}

export function toTargetArgs(target?: t.DenoVersion.Upgrade.Target): string[] {
  if (!target?.trim()) return [];
  return target.trim().split(/\s+/g);
}

export function ok<TData>(data: TData): t.DenoVersion.Result<TData> {
  return { ok: true, data, error: undefined };
}

export function fail<TData>(
  message: string,
  cause: unknown,
): t.DenoVersion.Result<TData> {
  const output = isOutput(cause) ? cause : undefined;
  const error = Err.std(message, {
    cause: output ? detail(output) || output : cause,
  });
  return {
    ok: false,
    data: undefined,
    error,
    output,
  };
}

function detail(output: t.DenoVersion.Output) {
  const stderr = output.text.stderr.trim();
  const stdout = output.text.stdout.trim();
  return stderr || stdout;
}

function isOutput(input: unknown): input is t.DenoVersion.Output {
  if (!input || typeof input !== 'object') return false;
  const value = input as Partial<t.DenoVersion.Output>;
  return typeof value.cmd === 'string' && Array.isArray(value.args) && typeof value.code === 'number';
}
