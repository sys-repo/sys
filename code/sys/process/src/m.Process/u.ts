import type { t } from './common.ts';
export { kill } from './u.kill.ts';

/**
 * Creates a configured `Deno.Command` from process invocation args.
 */
export function asCommand(
  input: t.ProcInvokeArgs,
  options: {
    stdin?: t.Stdio;
    stdout?: t.Stdio;
    stderr?: t.Stdio;
    forceColor?: boolean;
  } = {},
) {
  const { cwd, env } = input;
  const { stdin, stdout = 'piped', stderr = 'piped', forceColor = true } = options;

  const cmd = input.cmd ?? Deno.execPath();
  return new Deno.Command(cmd, {
    args: input.args ?? [],
    cwd,
    env: forceColor ? { ...env, FORCE_COLOR: env?.FORCE_COLOR ?? '1' } : env,
    stdin,
    stdout,
    stderr,
  });
}

/**
 * Converts a `Uint8Array` to a UTF-8 string.
 * Returns the input unchanged if it is already a string.
 */
export function asText(input: Uint8Array | string) {
  return typeof input === 'string' ? input : new TextDecoder().decode(input);
}

/**
 * Write [stdio] stream data to the console.
 */
export function printOutput(
  code: number,
  stdout: Uint8Array | string,
  stderr: Uint8Array | string,
) {
  const print = (text: string) => {
    const hasNewline = text.endsWith('\n');
    text = text.trim();
    if (!text) return;
    if (hasNewline) text = `${text}\n`;
    console.info(text);
  };

  if (code === 0) print(asText(stdout));
  else print(asText(stderr));
}

/**
 * Format [Deno.CommandOutput] into a standard output object.
 */
export function toProcOutput(input: Deno.CommandOutput): t.ProcOutput {
  const { code, success, signal, stdout, stderr } = input;
  let _stdout: undefined | string;
  let _stderr: undefined | string;
  const res: t.ProcOutput = {
    code,
    success,
    signal,
    stdout,
    stderr,
    text: {
      get stdout() {
        return _stdout ?? (_stdout = asText(stdout));
      },
      get stderr() {
        return _stderr ?? (_stderr = asText(stderr));
      },
    },
    toString() {
      return res.success ? res.text.stdout : res.text.stderr;
    },
  };
  return res;
}
