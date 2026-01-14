import { type t } from '../../-test.ts';
import { Process } from '../common.ts';

export const okOutput = () => makeOutput(true);
export const failOutput = (stderr: string) => makeOutput(false, stderr);
export function makeOutput(success: boolean, stderr = '', stdout = ''): t.ProcOutput {
  return {
    success,
    code: success ? 0 : 1,
    signal: null,
    stdout: new Uint8Array(),
    stderr: new Uint8Array(),
    text: { stdout, stderr },
    toString() {
      return stderr || stdout;
    },
  };
}

export async function withInvokeStub(
  stub: typeof Process.invoke,
  fn: () => Promise<void>,
): Promise<void> {
  const prev = Process.invoke;
  try {
    Process.invoke = stub;
    await fn();
  } finally {
    Process.invoke = prev;
  }
}
