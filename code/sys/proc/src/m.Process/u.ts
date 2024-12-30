import type { t } from './common.ts';
export { kill } from './u.kill.ts';

/**
 * Helpers
 */
export const Wrangle = {
  command(input: t.CmdInvokeArgs, options: { stdin?: t.Stdio } = {}) {
    const { cwd, env } = input;
    const { stdin } = options;
    const cmd = input.cmd ?? Deno.execPath();
    return new Deno.Command(cmd, {
      args: input.args ?? [],
      cwd,
      env: { ...env, FORCE_COLOR: '1' },
      stdin,
      stdout: 'piped', // Capture the "standard" output.
      stderr: 'piped', // Capture the "error" output.
    });
  },

  asText(input: Uint8Array | string) {
    return typeof input === 'string' ? input : new TextDecoder().decode(input);
  },
} as const;

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

  if (code === 0) print(Wrangle.asText(stdout));
  else print(Wrangle.asText(stderr));
}

/**
 * Format [Deno.CommandOutput] into a standard output object.
 */
export function toCmdOutput(input: Deno.CommandOutput): t.CmdOutput {
  const { code, success, signal, stdout, stderr } = input;
  let _stdout: undefined | string;
  let _stderr: undefined | string;
  const res: t.CmdOutput = {
    code,
    success,
    signal,
    stdout,
    stderr,
    text: {
      get stdout() {
        return _stdout ?? (_stdout = Wrangle.asText(stdout));
      },
      get stderr() {
        return _stderr ?? (_stderr = Wrangle.asText(stderr));
      },
    },
    toString() {
      return res.success ? res.text.stdout : res.text.stderr;
    },
  };
  return res;
}
