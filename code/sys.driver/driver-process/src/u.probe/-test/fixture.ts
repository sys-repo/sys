import { type t } from '../../-test.ts';
import { Process } from '../common.ts';

export const okOutput = (stdout = '') => makeOutput(true, '', stdout);
export const failOutput = (stderr = '', stdout = '') => makeOutput(false, stderr, stdout);

export function makeOutput(success: boolean, stderr = '', stdout = ''): t.Process.Output {
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
  run: () => Promise<void>,
): Promise<void> {
  const prev = Process.invoke;
  try {
    Process.invoke = stub;
    await run();
  } finally {
    Process.invoke = prev;
  }
}
