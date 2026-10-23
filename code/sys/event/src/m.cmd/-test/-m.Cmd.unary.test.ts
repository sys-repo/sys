import { describe, expect, it, type t } from '../../-test.ts';
import { Cmd } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('Cmd: unary request/response', () => {
  it('roundtrip → success', async () => {
    type Name = 'echo';
    type Payload = { echo: { msg: string } };
    type Result = { echo: { reply: string } };

    const cmd = Cmd.make<Name, Payload, Result>();
    const { port1, port2 } = new MessageChannel();

    const host = cmd.host(port1, {
      echo: ({ msg }) => ({ reply: msg.toUpperCase() }),
    });

    const client = cmd.client(port2);
    const res = await client.send('echo', { msg: 'hi' });

    expect(res).to.eql({ reply: 'HI' });

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });

  it('concurrent sends multiplex over one endpoint and resolve by request id', async () => {
    type Key = 'a' | 'b';
    type Name = 'hold';
    type Payload = { hold: { key: Key } };
    type Result = { hold: { key: Key; order: number } };

    const cmd = Cmd.make<Name, Payload, Result>();
    const { port1, port2 } = new MessageChannel();
    const pending = new Map<Key, (value: Result['hold']) => void>();
    const bothStarted = Fixture.waitForCount(2);

    const host = cmd.host(port1, {
      hold({ key }) {
        bothStarted.tick();
        return new Promise<Result['hold']>((resolve) => pending.set(key, resolve));
      },
    });

    const client = cmd.client(port2);
    const first = client.send('hold', { key: 'a' });
    const second = client.send('hold', { key: 'b' });

    await bothStarted.done;
    Fixture.resolvePending(pending, 'b', { key: 'b', order: 1 });
    Fixture.resolvePending(pending, 'a', { key: 'a', order: 2 });

    const [a, b] = await Promise.all([first, second]);
    expect(a).to.eql({ key: 'a', order: 2 });
    expect(b).to.eql({ key: 'b', order: 1 });

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });

  it('host handler receives request context', async () => {
    type Name = 'inspect';
    type Payload = { inspect: { value: number } };
    type Result = { inspect: { ok: boolean; value: number } };

    const ns: t.Cmd.Namespace = 'ctx/ns';
    const cmd = Cmd.make<Name, Payload, Result>({ ns });
    const { port1, port2 } = new MessageChannel();

    let context: {
      readonly id: t.Cmd.ReqId;
      readonly name: Name;
      readonly ns?: t.Cmd.Namespace;
      readonly aborted: boolean;
      readonly emit: 'function' | 'other';
    } | undefined;

    const host = cmd.host(port1, {
      inspect(payload, ctx) {
        context = {
          id: ctx.id,
          name: ctx.name,
          ns: ctx.ns,
          aborted: ctx.signal.aborted,
          emit: typeof ctx.emit === 'function' ? 'function' : 'other',
        };
        return { ok: true, value: payload.value };
      },
    });

    const client = cmd.client(port2);
    const res = await client.send('inspect', { value: 123 });

    expect(res).to.eql({ ok: true, value: 123 });
    expect(context?.id).to.match(/^req-/);
    expect(context?.name).to.eql('inspect');
    expect(context?.ns).to.eql(ns);
    expect(context?.aborted).to.eql(false);
    expect(context?.emit).to.eql('function');

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });
});
