import { c, stripAnsi } from '@sys/cli/fmt';
import { startError } from '../../../../../../sys/server/src/m.server.dist/u.server/u.error.ts';
import { describe, expect, it, Str, type t } from '../../../-test.ts';
import { dispatchWith as dispatch, serveWith } from '../u.serve.ts';

type Args = t.ViteEntry.Args.Serve;
type Effects = NonNullable<Parameters<typeof dispatch>[2]>;

const BASE = Str.dedent(`
  Cannot serve

    127.0.0.1:8080 is already in use.
    Stop the existing server or choose another port.
`);

describe('ViteEntry occupied serve dispatch', () => {
  it('handles authentic conflict once with semantic colors and one trailing EOL', async () => {
    const { calls, writes, effects } = harness();
    const args: Args = { cmd: 'serve', silent: true };
    const cause = startError('address-in-use');
    let attempts = 0;

    await dispatch(args, async (input) => {
      expect(input).to.equal(args);
      attempts++;
      throw cause;
    }, effects);

    const colored = Str.dedent(`
      ${c.red('Cannot serve')}

        ${c.white('127.0.0.1:8080 is already in use.')}
        ${c.gray('Stop the existing server or choose another port.')}
    `);

    expect(attempts).to.eql(1);
    expect(calls).to.eql(['write', 'exit:1']);
    // The renderer supplies one EOL; console.error supplies the second, leaving a blank line.
    expect(writes.map(stripAnsi)).to.eql([`${BASE}\n`]);
    expect(writes).to.eql([`${colored}\n`]);
  });

  it('keeps presentation idle until owned cleanup settles', async () => {
    const { calls, effects } = harness();
    const cleanup = Promise.withResolvers<void>();
    const pending = dispatch({ cmd: 'serve' }, async () => {
      await cleanup.promise;
      throw startError('address-in-use');
    }, effects);
    await Promise.resolve();
    expect(calls).to.eql([]);
    cleanup.resolve();
    await pending;
    expect(calls).to.eql(['write', 'exit:1']);
  });

  it('preserves requested ports and reports refusal regardless of silent', async () => {
    for (const port of [8081, 65535]) {
      for (const silent of [false, true]) {
        const { calls, writes, effects } = harness();
        await dispatch(
          { cmd: 'serve', port, silent },
          () => Promise.reject(startError('address-in-use')),
          effects,
        );
        const expected = Str.dedent(`
          Cannot serve

            127.0.0.1:${port} is already in use.
            Stop the existing server or choose another port.
        `);
        expect(writes.map(stripAnsi)).to.eql([`${expected}\n`]);
        expect(calls).to.eql(['write', 'exit:1']);
      }
    }
  });

  it('does no failure work on success, other reasons, forged errors or unexpected rejection', async () => {
    const causes = [
      undefined,
      startError('startup-failure'),
      startError('invalid-input'),
      { name: 'DistServer.StartError', reason: 'address-in-use' },
      new Error('unexpected'),
    ];
    for (const cause of causes) {
      const { calls, effects } = harness();
      const error = await caught(() =>
        dispatch(
          { cmd: 'serve' },
          () => cause === undefined ? Promise.resolve() : Promise.reject(cause),
          effects,
        )
      );
      expect(error).to.equal(cause);
      expect(calls).to.eql([]);
    }
  });

  it('programmatic serving still rejects the original occupied-port error', async () => {
    const cause = startError('address-in-use');
    const error = await caught(() =>
      serveWith({ cmd: 'serve' }, {
        Local: { serve: () => Promise.reject(cause) },
      })
    );
    expect(error).to.equal(cause);
  });
});

Deno.test({
  name: 'ViteEntry reports refusal without net authority',
  permissions: { net: false },
  async fn() {
    const { calls, writes, effects } = harness();
    await dispatch({ cmd: 'serve' }, () => Promise.reject(startError('address-in-use')), effects);
    expect(calls).to.eql(['write', 'exit:1']);
    expect(writes.map(stripAnsi)).to.eql([`${BASE}\n`]);
  },
});

function harness() {
  const calls: string[] = [];
  const writes: string[] = [];
  const effects: Effects = {
    write(text) {
      calls.push('write');
      writes.push(text);
    },
    exitCode: (code) => calls.push(`exit:${code}`),
  };
  return { calls, writes, effects };
}

/** Preserve thrown identity, including non-Errors; Try.run would normalize forged values. */
async function caught(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (cause) {
    return cause;
  }
}
