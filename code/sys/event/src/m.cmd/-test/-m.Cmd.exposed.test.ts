import { describe, Err, expect, expectError, it, type t } from '../../-test.ts';
import { Cmd } from '../mod.ts';

// Native MessageChannel exercises structured cloning, not an in-memory error shortcut.
describe('Cmd: explicitly exposed errors', () => {
  it('approved detail → survives mutation, transport, and client-side Err.std', async () => {
    const data = { operation: 'write', status: 403 };
    const exposed = Cmd.Error.expose({ name: 'FixtureFailure', message: 'Write refused.', data });
    data.status = 500;
    exposed.message = 'private mutated message';
    exposed.cause = new Error('private replaced cause');
    Object.assign(exposed, { secret: 'private field' });
    const error = await remote(exposed);
    expect(error.name).to.eql('CmdError.Remote');
    expect(error.message).to.eql('Write refused.');
    expect(Err.std(error).cause).to.eql({
      name: 'FixtureFailure',
      message: 'Write refused.',
      data: { operation: 'write', status: 403 },
    });
    expect(error).not.to.have.property('secret');
  });

  it('registered identity → captured detail survives a prototype change', async () => {
    const detail = { name: 'FixtureFailure', message: 'Approved refusal.' };
    const exposed = Cmd.Error.expose(detail);
    Object.setPrototypeOf(exposed, null);
    exposed.message = 'unapproved replacement';

    const error = await remote(exposed);
    expect(error.message).to.eql(detail.message);
    expect(error.cause).to.eql(detail);
  });

  it('wrapping, cloning, and matching fields → no implicit exposure', async () => {
    const detail = { name: 'FixtureFailure', message: 'refused', data: { status: 403 } };
    const exposed = Cmd.Error.expose(detail);
    const sources = [
      new Error(detail.message, { cause: exposed }),
      structuredClone(exposed),
      Err.std(exposed),
      { ...detail, cause: detail },
      await remote(exposed),
    ];
    for (const source of sources) {
      const error = await remote(source);
      expect(error.name).to.eql('CmdError.Remote');
      expect(error.message).to.eql(detail.message);
      expect(error.cause).to.eql(undefined);
    }
  });

  it('StdError → canonical message, without exposing its cause', async () => {
    const error = await remote(Err.std('standard refusal', { cause: new Error('private cause') }));
    expect(error.message).to.eql('standard refusal');
    expect(error.cause).to.eql(undefined);
  });

  it('invalid projection → synchronous refusal rather than unsafe wire data', () => {
    for (const data of [{ nested: {} }, { status: NaN }, { status: Infinity }]) {
      // @ts-expect-error Deliberate invalid input at the public runtime boundary.
      expect(() => Cmd.Error.expose({ name: 'Fixture', message: 'refused', data }))
        .to.throw('Invalid public command error detail.');
    }
  });

  it('malformed optional wire cause → retain the legacy rejection instead of hanging', async () => {
    const cmd = Cmd.make();
    const { port1, port2 } = new MessageChannel();
    port1.addEventListener('message', ({ data }) => {
      if (!Cmd.Is.request(data)) return;
      port1.postMessage({
        kind: 'cmd:result',
        name: data.name,
        id: data.id,
        error: 'refused',
        errorCause: data.payload,
      });
    });
    port1.start();
    try {
      using client = cmd.client(port2, { timeout: 100 });
      const invalid = [
        { name: 7, message: 'malformed detail' },
        { name: 'Fixture', message: 'unsafe', data: { nested: { secret: 'private' } } },
      ];
      for (const detail of invalid) {
        const error = await expectError(() => client.send('fail', detail));
        expect(error.name).to.eql('CmdError.Remote');
        expect(error.message).to.eql('refused');
        expect(error.cause).to.eql(undefined);
      }
    } finally {
      port1.close();
      port2.close();
    }
  });

  it('ordinary error → legacy message only, without automatic cause or metadata exposure', async () => {
    const source = Object.assign(new Error('legacy', { cause: new Error('private cause') }), {
      data: { secret: 'private field' },
    });
    const error = await remote(source);
    expect(error.message).to.eql('legacy');
    expect(error.cause).to.eql(undefined);
  });
});

describe('Cmd: host message capture', () => {
  for (const mode of ['unary', 'stream'] as const) {
    it(`${mode}: changing message getter → one read and a remote rejection`, async () => {
      let reads = 0;
      const error = await remote({
        get message() {
          return reads++ === 0 ? 'refused' : undefined;
        },
      }, mode);
      expect(error.name).to.eql('CmdError.Remote');
      expect(error.message).to.eql('refused');
      expect(reads).to.eql(1);
    });

    it(`${mode}: throwing message getter → fallback rejection, not an escaped exception`, async () => {
      let reads = 0;
      const error = await remote({
        get message() {
          reads++;
          throw new Error('private accessor failure');
        },
      }, mode);
      expect(error.name).to.eql('CmdError.Remote');
      expect(error.message).to.eql('Command handler failed.');
      expect(error.cause).to.eql(undefined);
      expect(reads).to.eql(1);
    });
  }
});

describe('Cmd: optional wire diagnostics', () => {
  it('throwing detail accessor → immediate legacy rejection and pending-request cleanup', async () => {
    // A non-cloning endpoint preserves accessors that native MessageChannel cannot deliver.
    const listeners = new Set<(event: MessageEvent) => void>();
    const sent: unknown[] = [];
    const endpoint: t.Cmd.Endpoint = {
      postMessage: (message) => sent.push(message),
      addEventListener: (_type, listener) => listeners.add(listener),
      removeEventListener: (_type, listener) => listeners.delete(listener),
    };
    const client = Cmd.make().client(endpoint, { timeout: 1000 });
    const failed = expectError(() => client.send('fail', {}));
    let reads = 0;
    try {
      expect(listeners.size).to.eql(1);
      const request = sent[0];
      if (!Cmd.Is.request(request)) throw new Error('Expected a command request.');
      const event = new MessageEvent('message', {
        data: {
          kind: 'cmd:result',
          id: request.id,
          name: request.name,
          error: 'refused',
          get errorCause() {
            reads++;
            throw new Error('unreadable optional detail');
          },
        },
      });
      expect(() => {
        for (const listener of listeners) listener(event);
      }).not.to.throw();
      const error = await failed;
      expect(error.name).to.eql('CmdError.Remote');
      expect(error.message).to.eql('refused');
      expect(error.cause).to.eql(undefined);
      expect(reads).to.eql(1);

      // The completed request is no longer pending, so a late result does not read its detail.
      for (const listener of listeners) listener(event);
      expect(reads).to.eql(1);
    } finally {
      client.dispose();
      await failed;
    }
    expect(listeners.size).to.eql(0);
    expect(sent.length).to.eql(1); // No cancellation for a completed request.
  });
});

async function remote(source: unknown, mode: 'unary' | 'stream' = 'unary') {
  const cmd = Cmd.make();
  const transport = Cmd.Transport.local({
    factory: cmd,
    handlers: {
      fail() {
        throw source;
      },
    },
  });
  try {
    using client = cmd.client(transport.endpoint, { timeout: 1000 });
    if (mode === 'unary') return await expectError(() => client.send('fail', {}));

    const stream = client.stream('fail', {});
    using subscription = stream.onEvent(() => {});
    const [error, iterationError] = await Promise.all([
      expectError(() => stream.done),
      expectError(() => stream[Symbol.asyncIterator]().next()),
    ]);
    expect(iterationError).to.equal(error);
    expect(subscription.disposed).to.eql(true);
    return error;
  } finally {
    transport.dispose();
  }
}
