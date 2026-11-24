import { describe, expect, expectTypeOf, Is, it, type t } from '../../-test.ts';
import { HttpCmd } from '../mod.ts';
import { fetchFor, POLICY, request, URL } from './u.fixture.ts';

type Name = 'echo';
type Payload = { readonly echo: { readonly text: string } };
type Result = {
  readonly echo: { readonly kind: 'accepted'; readonly text: string } | {
    readonly kind: 'rejected';
  };
};
type Client = t.HttpCmd.Client<Name, Payload, Result>;

describe('HttpCmd consumer contracts', () => {
  it('requires finite policy and restricts call authority at the type boundary', () => {
    expectTypeOf<t.HttpCmd.Policy>({
      maxBytes: { request: 1024, response: 4096 },
      timeout: 1_000,
    });
    expectTypeOf<t.HttpCmd.Policy>({
      // @ts-expect-error Byte caps belong to the shared maxBytes group.
      maxRequestBytes: 1024,
      maxResponseBytes: 4096,
      timeout: 1_000,
    });
    expectTypeOf<t.HttpCmd.ClientOptions>({ url: URL, policy: POLICY });
    // @ts-expect-error A bounded client requires explicit policy.
    expectTypeOf<t.HttpCmd.ClientOptions>({ url: URL });
    // @ts-expect-error Timeout is owned by finite policy, not a second client option.
    expectTypeOf<t.HttpCmd.ClientOptions>({ url: URL, policy: POLICY, timeout: 1 });
    // @ts-expect-error The handler requires bounds too.
    expectTypeOf<t.HttpCmd.HandlerOptions>({ cmd: { handlers: {} } });
    expectTypeOf<Parameters<Client['send']>>(['echo', { text: 'ok' }]);
    expectTypeOf<Parameters<Client['send']>>(['echo', { text: 'ok' }, {
      signal: new AbortController().signal,
    }]);
    // @ts-expect-error No per-call endpoint authority.
    expectTypeOf<Parameters<Client['send']>>(['echo', { text: 'ok' }, { url: URL }]);
    // @ts-expect-error Payloads retain the operation-selected contract.
    expectTypeOf<Parameters<Client['send']>>(['echo', { text: 1 }]);
  });

  it('remains unary-assignable while domain admission and rejections stay in the binding', async () => {
    const options: t.HttpCmd.HandlerOptions<Name, Payload, Result> = {
      policy: POLICY,
      cmd: {
        handlers: {
          echo(payload) {
            if (!Is.record(payload) || !Is.str(payload.text)) return { kind: 'rejected' };
            return { kind: 'accepted', text: payload.text };
          },
        },
      },
    };
    const client = HttpCmd.client<Name, Payload, Result>({
      url: URL,
      policy: POLICY,
      fetch: fetchFor(HttpCmd.handler(options)),
    });
    expectTypeOf<t.Cmd.Client.Unary<Name, Payload, Result>>(client);
    try {
      expect(await client.send('echo', { text: 'two' })).to.eql({ kind: 'accepted', text: 'two' });
      expect(
        await client.send('echo', { text: 'three' }, { headers: { Authorization: 'private' } }),
      ).to.eql({ kind: 'accepted', text: 'three' });
      const response = await HttpCmd.handle(
        request({ ns: undefined, name: 'echo', payload: { text: null } }),
        options,
      );
      expect(response.status).to.eql(200);
      expect((await response.json()).payload).to.eql({ kind: 'rejected' });
    } finally {
      client.dispose();
    }
  });
});
