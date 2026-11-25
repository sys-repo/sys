import { serveWith } from '../task.serve.ts';
import { describe, expect, expectError, it } from './common.ts';

describe('R2 deployment sample: serve task', () => {
  for (const registration of ['unsupported', 'throw'] as const) {
    it(`SIGINT registration ${registration} → disposes server without waiting`, async () => {
      const server = serverFixture();
      const failure = new Error('SIGINT registration failed');
      const serving = serveWith(server.start, (name) => {
        server.order.push(name);
        if (registration === 'throw') throw failure;
        return { kind: 'unsupported' };
      });

      const cause = await expectError(() => serving);
      expect(server.order).to.eql(['start', 'SIGINT', 'server.dispose']);
      if (registration === 'throw') expect(cause).to.equal(failure);
      else expect(cause.message).to.eql('Sample serve requires a SIGINT subscription.');
    });
  }

  for (const outcome of ['complete', 'reject'] as const) {
    it(`SIGINT abort and server ${outcome} → releases subscription before server disposal`, async () => {
      const finished = Promise.withResolvers<void>();
      const server = serverFixture(finished.promise);
      const attached = Promise.withResolvers<() => void>();
      const serving = serveWith(server.start, (name, handler) => {
        server.order.push(name);
        attached.resolve(handler);
        return { kind: 'attached', dispose: () => server.order.push('signal.dispose') };
      });

      const interrupt = await attached.promise;
      expect(server.signal?.aborted).to.eql(false);
      interrupt();
      expect(server.signal?.reason).to.eql('SIGINT');
      expect(server.order).to.eql(['start', 'SIGINT']);

      if (outcome === 'reject') {
        const failure = new Error('Server failed');
        finished.reject(failure);
        expect(await expectError(() => serving)).to.equal(failure);
      } else {
        finished.resolve();
        await serving;
      }
      expect(server.order).to.eql(['start', 'SIGINT', 'signal.dispose', 'server.dispose']);
    });
  }
});

function serverFixture(finished?: Promise<void>) {
  const order: string[] = [];
  let signal: AbortSignal | undefined;
  const server = {
    get finished() {
      if (!finished) throw new Error('Unexpected wait without a SIGINT subscription');
      return finished;
    },
    [Symbol.asyncDispose]() {
      order.push('server.dispose');
      return Promise.resolve();
    },
  };
  return {
    order,
    get signal() {
      return signal;
    },
    start(until: AbortSignal) {
      order.push('start');
      signal = until;
      return Promise.resolve(server);
    },
  };
}
