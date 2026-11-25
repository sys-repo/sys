import { describe, expect, expectError, it, type t, Time } from './common.ts';
import { runLeaf, runOwner, watchLeafOutput } from './u.fixture.cli.vite.child.ts';

type Name = t.Process.Signal.Name;
type Subscribe = t.Process.Signal.Lib['on'];

const failures = ['unsupported', 'throw'] as const;

describe('Cell Vite child fixture signal setup', () => {
  for (const failure of failures) {
    for (const name of ['SIGTERM', 'SIGWINCH'] as const) {
      it(`${name} ${failure} → releases earlier listeners without acquiring the leaf`, async () => {
        const proof = registrationFailure(name, failure);
        const output: string[] = [];
        const error = await expectError(() =>
          runOwner('delayed', {
            on: proof.on,
            report: (message) => output.push(message),
            spawn() {
              throw new Error('Leaf acquired before required listeners were attached.');
            },
          })
        );
        expect(error.message).to.eql(proof.message);
        if (failure === 'throw') expect(error).to.equal(proof.error);
        expect(output).to.eql([`OWNER:${Deno.pid}`]);
        expect(proof.released).to.eql(name === 'SIGTERM' ? ['SIGINT'] : ['SIGTERM', 'SIGINT']);
      });
    }

    it(`leaf ${failure} → releases its actual server without reporting readiness`, async () => {
      const proof = registrationFailure('SIGTERM', failure);
      const output: string[] = [];
      const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, () => {
        return new Response('fixture');
      });
      const { port } = server.addr;
      try {
        const error = await expectError(() =>
          runLeaf({
            on: proof.on,
            report: (message) => output.push(message),
            serve: () => server,
          })
        );
        expect(error.message).to.eql(proof.message);
        if (failure === 'throw') expect(error).to.equal(proof.error);
        expect(output).to.eql([]);
        using listener = Deno.listen({ hostname: '127.0.0.1', port });
        expect(listener.addr.port).to.eql(port);
      } finally {
        await server.shutdown();
      }
    });
  }

  it('leaf acknowledges only after signal-driven shutdown and server completion', async () => {
    const output: string[] = [];
    const shutdown = Promise.withResolvers<void>();
    const finished = Promise.withResolvers<void>();
    const addr = { transport: 'tcp', hostname: '127.0.0.1', port: 12345 } as const;
    const ready = `LEAF:${Deno.pid}:${addr.port}`;
    let requested = false;
    let signal: (() => void) | undefined;
    const leaf = runLeaf({
      on(name, handler) {
        expect(name).to.eql('SIGTERM');
        signal = handler;
        return { kind: 'attached', dispose() {} };
      },
      report: (line) => output.push(line),
      serve: () => ({
        addr,
        finished: finished.promise,
        shutdown() {
          requested = true;
          return shutdown.promise;
        },
        [Symbol.asyncDispose]: () => finished.promise,
      }),
    });
    try {
      expect(output).to.eql([ready]);
      if (!signal) throw new Error('Expected a SIGTERM handler.');
      signal();
      await Time.delay(0);
      expect(requested).to.eql(true);
      expect(output).to.eql([ready]);
      shutdown.resolve();
      await Time.delay(0);
      expect(output).to.eql([ready]);
    } finally {
      shutdown.resolve();
      finished.resolve();
      await leaf;
    }
    expect(output).to.eql([ready, 'LEAF_CLEAN']);
  });

  it('a complete or split acknowledgement that starts before the request is rejected', async () => {
    for (const chunks of [['LEAF_CLEAN\n'], ['LEAF_CL', 'EAN\n']]) {
      const output = watchLeafOutput(byteStream(chunks), (text) => {
        if (text === chunks[0]) output.markShutdownRequested();
      });
      expect(await output.acknowledged).to.eql(false);
    }
  });

  const unexpectedExits = [
    {
      label: 'successful leaf exit without a complete acknowledgement',
      chunks: ['NOT_LEAF_CLEAN\n', 'partial\rLEAF_CLEAN\n', 'LEAF_CLEAN'],
      status: { success: true, code: 0, signal: null },
      acknowledged: false,
      message: 'Fixture leaf exited without acknowledging server shutdown.',
    },
    {
      label: 'unsuccessful leaf exit with an acknowledgement',
      chunks: ['LEAF_CL', 'EAN\r', '\n'],
      status: { success: false, code: 1, signal: null },
      acknowledged: true,
      message: 'Unexpected fixture leaf exit: code=1, signal=null.',
    },
  ];
  for (const row of unexpectedExits) {
    it(`${row.label} → rejects instead of reporting CLEAN`, async () => {
      const output: string[] = [];
      const handlers = new Map<Name, () => void>();
      const finished = Promise.withResolvers<{
        status: Deno.CommandStatus;
        acknowledged: boolean;
      }>();
      let disposed = false;
      const owner = runOwner('delayed', {
        delay: 0,
        on(name, handler) {
          handlers.set(name, handler);
          return { kind: 'attached', dispose: () => handlers.delete(name) };
        },
        report: (message) => output.push(message),
        spawn: () => ({
          finished: finished.promise,
          terminate() {
            const leaf = watchLeafOutput(byteStream(row.chunks), () => {});
            leaf.markShutdownRequested();
            finished.resolve(leaf.acknowledged.then((acknowledged) => ({
              status: row.status,
              acknowledged,
            })));
          },
          [Symbol.asyncDispose]() {
            disposed = true;
            return Promise.resolve();
          },
        }),
      });
      handlers.get('SIGINT')!();
      const error = await expectError(() => owner);
      expect(error.message).to.eql(row.message);
      expect((await finished.promise).acknowledged).to.eql(row.acknowledged);
      expect(output).to.eql([`OWNER:${Deno.pid}`, `OWNER_READY:${Deno.pid}`, 'CLOSING']);
      expect(disposed).to.eql(true);
      expect(handlers.size).to.eql(0);
    });
  }
});

function byteStream(chunks: string[]) {
  const encoder = new TextEncoder();
  return ReadableStream.from(chunks.map((chunk) => encoder.encode(chunk)));
}

function registrationFailure(target: Name, failure: 'unsupported' | 'throw') {
  const error = new Error(`Registration failed for ${target}.`);
  const released: Name[] = [];
  const on: Subscribe = (name) => {
    if (name !== target) return { kind: 'attached', dispose: () => released.push(name) };
    if (failure === 'throw') throw error;
    return { kind: 'unsupported' };
  };
  const message = failure === 'throw' ? error.message : `Fixture requires ${target}.`;
  return { error, on, released, message };
}
