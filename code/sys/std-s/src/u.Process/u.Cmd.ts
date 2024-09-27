import type { t } from '../common/mod.ts';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export const Cmd: t.Cmd = {
  /**
   * Run an <shell> command.
   * When using grant the "--allow-run=sh" permission argument.
   */
  sh(...input: unknown[]) {
    const options = wrangle.shellOptions(input);
    const path = options.path ?? '';
    return {
      path,
      run(...args) {
        const { silent } = options;
        const command = [...(options.args ?? []), ...args];
        if (path) command.unshift(`cd ${path}`);
        return Cmd.invoke(['-c', command.join(' && ')], { cmd: 'sh', silent });
      },
    };
  },

  /**
   * Run a <unix> command (on spawned child process).
   */
  async invoke(args, options = {}) {
    const { cwd, env } = options;
    const cmd = options.cmd ?? Deno.execPath();
    const command = new Deno.Command(cmd, {
      args,
      cwd,
      env,
      stdout: 'piped', // Capture the "standard" output.
      stderr: 'piped', // Capture the "error" output.
    });

    // Execute the command and collect its output.
    const output = await command.output();
    const res = Cmd.decode(output);
    if (!options.silent) printOutput(res.code, res.stdout, res.stderr);
    return res;
  },

  /**
   * Decode a command output to strings.
   */
  decode(input) {
    const { code, success, signal, stdout, stderr } = input;
    let _stdout: undefined | string;
    let _stderr: undefined | string;
    const output: t.CmdOutput = {
      code,
      success,
      signal,
      stdout,
      stderr,
      text: {
        get stdout() {
          return _stdout ?? (_stdout = wrangle.asText(stdout));
        },
        get stderr() {
          return _stderr ?? (_stderr = wrangle.asText(stderr));
        },
      },
      toString() {
        return output.success ? output.text.stdout : output.text.stderr;
      },
    };
    return output;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  shellOptions(input: unknown[]): t.ShellCmdOptions {
    if (input.length === 0) return {};
    if (typeof input[0] === 'string') return { path: input[0] };
    if (typeof input[0] === 'object') return input[0] as t.ShellCmdOptions;
    return {};
  },

  asText(input: Uint8Array | string) {
    return typeof input === 'string' ? input : new TextDecoder().decode(input);
  },
} as const;

function printOutput(code: number, stdout: Uint8Array | string, stderr: Uint8Array | string) {
  const print = (text: string) => {
    const hasNewline = text.endsWith('\n');
    text = text.trim();
    if (!text) return;
    if (hasNewline) text = `${text}\n`;
    console.info(text);
  };

  if (code === 0) print(wrangle.asText(stdout));
  else print(wrangle.asText(stderr));
}
