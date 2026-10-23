import { describe, expect, it } from '../../-test.ts';
import { Cmd } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('Cmd: lifecycle and transport ownership', () => {
  it('dispose → removes listeners but keeps endpoints open by default', () => {
    type Name = 'ping';
    type Payload = { ping: {} };
    type Result = { ping: {} };

    const cmd = Cmd.make<Name, Payload, Result>();
    const { port1, port2 } = new MessageChannel();
    const endpoint1 = Fixture.trackEndpoint(port1);
    const endpoint2 = Fixture.trackEndpoint(port2);

    const host = cmd.host(endpoint1, { ping: () => ({}) });
    const client = cmd.client(endpoint2);

    client.dispose();
    host.dispose();

    expect(endpoint1.closed()).to.eql(0);
    expect(endpoint2.closed()).to.eql(0);

    port1.close();
    port2.close();
  });

  it('host.dispose → settles active requests with remote CmdError', async () => {
    type Name = 'slow';
    type Payload = { slow: {} };
    type Result = { slow: { ok: boolean } };

    const cmd = Cmd.make<Name, Payload, Result>();
    const { port1, port2 } = new MessageChannel();

    let startedResolve: () => void = () => {};
    const started = new Promise<void>((resolve) => {
      startedResolve = resolve;
    });
    let abortSeenResolve: () => void = () => {};
    const abortSeen = new Promise<void>((resolve) => {
      abortSeenResolve = resolve;
    });

    const host = cmd.host(port1, {
      slow(_payload, ctx) {
        startedResolve();
        return new Promise<Result['slow']>((resolve) => {
          ctx.signal.addEventListener(
            'abort',
            () => {
              abortSeenResolve();
              resolve({ ok: false });
            },
            { once: true },
          );
        });
      },
    });

    const client = cmd.client(port2);
    const pending = client.send('slow', {}).catch((err: unknown) => err);

    await started;
    host.dispose();

    const err = await pending;
    const error = Fixture.expectCmdError(err, 'CmdError.Remote');
    expect(error.message).to.eql('Command host disposed before response was sent.');
    expect(error.cmd?.name).to.eql('slow');
    expect(error.cmd?.id).to.match(/^req-/);
    await abortSeen;

    client.dispose();
    port1.close();
    port2.close();
  });

  it('client.dispose → rejects active stream and disposes event subscriptions', async () => {
    type Name = 'slow';
    type Payload = { slow: {} };
    type Result = { slow: { ok: boolean } };
    type Events = { slow: { tick: number } };

    const cmd = Cmd.make<Name, Payload, Result, Events>();
    const { port1, port2 } = new MessageChannel();

    let startedResolve: () => void = () => {};
    const started = new Promise<void>((resolve) => {
      startedResolve = resolve;
    });
    let abortSeenResolve: () => void = () => {};
    const abortSeen = new Promise<void>((resolve) => {
      abortSeenResolve = resolve;
    });

    const host = cmd.host(port1, {
      slow(_payload, ctx) {
        startedResolve();
        return new Promise<Result['slow']>((resolve) => {
          ctx.signal.addEventListener(
            'abort',
            () => {
              abortSeenResolve();
              resolve({ ok: false });
            },
            { once: true },
          );
        });
      },
    });

    const client = cmd.client(port2);
    const stream = client.stream('slow', {});
    const subscription = stream.onEvent(() => {});
    const pending = stream.done.catch((err: unknown) => err);

    await started;
    client.dispose();
    expect(subscription.disposed).to.eql(true);

    const err = await pending;
    Fixture.expectCmdError(err, 'CmdError.ClientDisposed');
    await abortSeen;

    host.dispose();
    port1.close();
    port2.close();
  });

  it('client disposed before send/stream → rejects new commands', async () => {
    type Name = 'ping';
    type Payload = { ping: {} };
    type Result = { ping: { ok: boolean } };
    type Events = { ping: { tick: number } };

    const cmd = Cmd.make<Name, Payload, Result, Events>();
    const { port1, port2 } = new MessageChannel();
    const client = cmd.client(port2);

    client.dispose();

    const sendErr = await client.send('ping', {}).catch((err: unknown) => err);
    const sendError = Fixture.expectCmdError(sendErr, 'CmdError.ClientDisposed');
    expect(sendError.cmd?.name).to.eql('ping');
    expect(sendError.cmd?.id).to.match(/^req-/);

    const stream = client.stream('ping', {});
    const streamErr = await stream.done.catch((err: unknown) => err);
    const streamError = Fixture.expectCmdError(streamErr, 'CmdError.ClientDisposed');
    expect(streamError.cmd?.name).to.eql('ping');
    expect(streamError.cmd?.id).to.match(/^req-/);

    const iteratorErr = await stream[Symbol.asyncIterator]().next().catch((err: unknown) => err);
    Fixture.expectCmdError(iteratorErr, 'CmdError.ClientDisposed');

    const subscription = stream.onEvent(() => {});
    expect(subscription.disposed).to.eql(true);

    port1.close();
    port2.close();
  });

  it('closeEndpoint → opts into endpoint closing', () => {
    type Name = 'ping';
    type Payload = { ping: {} };
    type Result = { ping: {} };

    const cmd = Cmd.make<Name, Payload, Result>();
    const { port1, port2 } = new MessageChannel();
    const endpoint1 = Fixture.trackEndpoint(port1);
    const endpoint2 = Fixture.trackEndpoint(port2);

    const host = cmd.host(endpoint1, { ping: () => ({}) }, { closeEndpoint: true });
    const client = cmd.client(endpoint2, { closeEndpoint: true });

    client.dispose();
    host.dispose();

    expect(endpoint1.closed()).to.eql(1);
    expect(endpoint2.closed()).to.eql(1);
  });
});
