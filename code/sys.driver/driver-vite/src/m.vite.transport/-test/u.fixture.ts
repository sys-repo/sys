import { type t } from '../common.ts';

export function procOutput(args: {
  success: boolean;
  stdout?: string;
  stderr?: string;
  code?: number;
}): t.ProcOutput {
  return {
    success: args.success,
    code: args.code ?? (args.success ? 0 : 1),
    signal: null,
    text: {
      stdout: args.stdout ?? '',
      stderr: args.stderr ?? '',
    },
    stdout: new Uint8Array(),
    stderr: new Uint8Array(),
    toString() {
      return this.text.stderr || this.text.stdout;
    },
  };
}
