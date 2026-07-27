import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Process } from '../mod.ts';
import { createStdout, stdout } from '../u/u.stdout.ts';

describe('Process.stdout', () => {
  it('assembles the canonical host stdout capability', () => {
    expect(Process.stdout).to.equal(stdout);
    expectTypeOf(Process.stdout).toEqualTypeOf<t.Process.Stdout>();
  });

  it('adapts terminal detection and text writes without leaking the runtime stream', () => {
    const writes: Uint8Array[] = [];
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const terminal = createStdout({
      stdout: {
        isTerminal: () => true,
        writeSync(data) {
          const count = Math.min(2, data.byteLength);
          writes.push(data.slice(0, count));
          return count;
        },
      },
      encode: (text) => encoder.encode(text),
    });
    const redirected = createStdout({
      stdout: {
        isTerminal: () => false,
        writeSync: () => 0,
      },
      encode: (text) => encoder.encode(text),
    });
    const unavailable = createStdout({
      stdout: {
        isTerminal: () => {
          throw new Error('unavailable');
        },
        writeSync: () => 0,
      },
      encode: (text) => encoder.encode(text),
    });

    const stalled = createStdout({
      stdout: {
        isTerminal: () => true,
        writeSync: () => 0,
      },
      encode: (text) => encoder.encode(text),
    });

    terminal.write('frame');

    expect(terminal.isTerminal()).to.eql(true);
    expect(redirected.isTerminal()).to.eql(false);
    expect(unavailable.isTerminal()).to.eql(false);
    expect(writes.map((item) => decoder.decode(item)).join('')).to.eql('frame');
    expect(writes.length).to.eql(3);
    expect(() => stalled.write('frame')).to.throw('Failed to write the complete stdout payload.');
  });
});
