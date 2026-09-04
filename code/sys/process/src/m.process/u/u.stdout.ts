import type { t } from '../common.ts';

type Writer = {
  isTerminal(): boolean;
  writeSync(data: Uint8Array): number;
};

type Runtime = {
  stdout: Writer;
  encode(text: string): Uint8Array;
};

const encoder = new TextEncoder();

/** Create a host stdout capability over injected runtime effects. */
export function createStdout(runtime: Runtime): t.Process.Stdout {
  return {
    isTerminal() {
      try {
        return runtime.stdout.isTerminal();
      } catch {
        return false;
      }
    },
    write: (text) => writeAll(runtime.stdout, runtime.encode(text)),
  };
}

/** Canonical host-process stdout capability. */
export const stdout = Object.freeze(
  createStdout({
    stdout: Deno.stdout,
    encode: (text) => encoder.encode(text),
  }),
);

/**
 * Helpers:
 */
function writeAll(writer: Writer, data: Uint8Array) {
  let offset = 0;
  // Stream writes may be partial, so advance through the one preconstructed payload.
  while (offset < data.byteLength) {
    const count = writer.writeSync(data.subarray(offset));
    if (count <= 0) throw new Error('Failed to write the complete stdout payload.');
    offset += count;
  }
}
