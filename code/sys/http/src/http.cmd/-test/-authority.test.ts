import { describe, expect, it, Json, Num, type t } from '../../-test.ts';
import { Cmd } from '../common.ts';
import { HttpCmd } from '../mod.ts';
import { expectFailure, fetchFor, NS, options, POLICY, request, URL } from './u.fixture.ts';

describe('HttpCmd request authority', () => {
  it('requires positive safe-integer policy on both transport directions', async () => {
    for (const key of ['request', 'response', 'timeout']) {
      for (const value of [undefined, 0, -1, 0.5, NaN, Num.INFINITY, Num.MAX_INT + 1]) {
        const policy = (key === 'timeout'
          ? { ...POLICY, timeout: value }
          : { ...POLICY, maxBytes: { ...POLICY.maxBytes, [key]: value } }) as t.HttpCmd.Policy;
        await expectFailure(
          () => {
            return Promise.resolve(HttpCmd.client({ url: URL, policy }));
          },
          'invalid-options',
          'not-dispatched',
        );
        await expectFailure(
          () => {
            return Promise.resolve(HttpCmd.handler(options({ policy })));
          },
          'invalid-options',
          'not-dispatched',
        );
        await expectFailure(
          () => {
            return HttpCmd.handle(request(), options({ policy }));
          },
          'invalid-options',
          'not-dispatched',
        );
      }
    }
    for (
      const input of [{ url: URL }, { url: URL, policy: POLICY, timeout: 1 }, {
        url: `${URL}#private`,
        policy: POLICY,
      }, { url: 'https://user:secret@example.test', policy: POLICY }]
    ) {
      await expectFailure(
        () => Promise.resolve(HttpCmd.client(input as t.HttpCmd.ClientOptions)),
        'invalid-options',
        'not-dispatched',
      );
    }
    const client = HttpCmd.client({
      url: URL,
      ns: NS,
      policy: {
        maxBytes: { request: Num.MAX_INT, response: Num.MAX_INT },
        timeout: Num.MAX_INT,
      },
      fetch: fetchFor(HttpCmd.handler(options())),
    });
    try {
      // The long policy must not overflow a host timer into an immediate timeout.
      expect(await client.send('fixture.echo', { text: 'long timeout' })).to.eql({
        text: 'long timeout',
      });
    } finally {
      client.dispose();
    }
  });

  it('rejects malformed or unsupported byte-limit configuration on both directions', async () => {
    for (
      const policy of [
        undefined,
        { timeout: 1_000 },
        { ...POLICY, maxBytes: null },
        { ...POLICY, maxBytes: {} },
        { ...POLICY, maxBytes: { request: 1024 } },
        { ...POLICY, maxBytes: { response: 4096 } },
        { ...POLICY, maxBytes: { ...POLICY.maxBytes, other: 1 } },
        { ...POLICY, maxBytes: { ...POLICY.maxBytes, [Symbol('extra')]: 1 } },
        { ...POLICY, maxRequestBytes: 1024, maxResponseBytes: 4096 },
      ]
    ) {
      const invalid = policy as t.HttpCmd.Policy;
      await expectFailure(
        () => Promise.resolve(HttpCmd.client({ url: URL, policy: invalid })),
        'invalid-options',
        'not-dispatched',
      );
      await expectFailure(
        () => Promise.resolve(HttpCmd.handler(options({ policy: invalid }))),
        'invalid-options',
        'not-dispatched',
      );
      await expectFailure(
        () => HttpCmd.handle(request(), options({ policy: invalid })),
        'invalid-options',
        'not-dispatched',
      );
    }
  });

  it('snapshots endpoint, fetch, policy, headers, and per-call authority before suspension', async () => {
    const gate = Promise.withResolvers<void>();
    const captures: Array<{ url: string; init: RequestInit }> = [];
    const base = new Headers({ Authorization: 'base-secret', Accept: 'not-json' });
    const original = HttpCmd.handler(options());
    const policy: t.DeepMutable<t.HttpCmd.Policy> = {
      ...POLICY,
      maxBytes: { ...POLICY.maxBytes },
    };
    const settings = {
      url: URL,
      ns: NS,
      policy,
      headers: base,
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        captures.push({ url: String(input), init: init! });
        await gate.promise;
        return original(new Request(input, init));
      },
    };
    const client = HttpCmd.client(settings);
    settings.url = 'https://wrong.test';
    settings.policy.timeout = 1;
    settings.policy.maxBytes.request = 1;
    settings.policy.maxBytes.response = 1;
    settings.fetch = () => Promise.reject(new Error('must not run'));
    base.set('Authorization', 'mutated-secret');
    const a = { headers: new Headers({ AUTHORIZATION: 'a-secret', 'Content-Type': 'bad' }) };
    const b = { headers: { Authorization: 'b-secret' } };
    const first = client.send('fixture.echo', { text: 'a' }, a);
    const second = client.send('fixture.echo', { text: 'b' }, b);
    a.headers.set('Authorization', 'too-late');
    b.headers.Authorization = 'too-late';
    gate.resolve();
    try {
      expect(await first).to.eql({ text: 'a' });
      expect(await second).to.eql({ text: 'b' });
      expect(captures.map(({ url }) => url)).to.eql([URL, URL]);
      expect(captures.map(({ init }) => new Headers(init.headers).get('authorization'))).to.eql([
        'a-secret',
        'b-secret',
      ]);
      for (const { init } of captures) {
        expect(init.method).to.eql('POST');
        expect(init.credentials).to.eql('omit');
        expect(init.redirect).to.eql('manual');
        expect(init.cache).to.eql('no-store');
        expect(init.referrer).to.eql('');
        expect(init.referrerPolicy).to.eql('no-referrer');
        expect(new Headers(init.headers).get('content-type')).to.eql(
          'application/json; charset=utf-8',
        );
        expect(new Headers(init.headers).get('accept')).to.eql('application/json');
      }
    } finally {
      client.dispose();
    }
  });

  it('rejects reserved headers and unsupported call authority before fetch', async () => {
    let calls = 0;
    const client = HttpCmd.client({
      url: URL,
      policy: POLICY,
      fetch: () => {
        calls++;
        throw new Error('secret');
      },
    });
    try {
      for (
        const name of [
          'Cookie',
          'Cookie2',
          'Host',
          'Content-Length',
          'Transfer-Encoding',
          'Connection',
          'Origin',
          'Referer',
        ]
      ) {
        await expectFailure(
          () =>
            Promise.resolve(
              HttpCmd.client({ url: URL, policy: POLICY, headers: { [name]: 'secret' } }),
            ),
          'invalid-options',
          'not-dispatched',
        );
        await expectFailure(
          () => client.send('x', {}, { headers: { [name]: 'secret' } }),
          'invalid-request',
          'not-dispatched',
        );
      }
      for (
        const input of [
          { url: URL },
          { method: 'GET' },
          { timeout: 1 },
          { credentials: 'include' },
          { signal: {} },
        ]
      ) {
        await expectFailure(
          () => client.send('x', {}, input as t.HttpCmd.SendOptions),
          'invalid-request',
          'not-dispatched',
        );
      }
      expect(calls).to.eql(0);
    } finally {
      client.dispose();
    }
  });

  it('snapshots own callable handlers and nested policy at factory or direct-request entry', async () => {
    const source = { ...options().cmd.handlers };
    const policy: t.DeepMutable<t.HttpCmd.Policy> = {
      ...POLICY,
      maxBytes: { ...POLICY.maxBytes },
    };
    const opts = options({ policy, cmd: { handlers: source } });
    const handler = HttpCmd.handler(opts);
    const direct = HttpCmd.handle(request({ ns: undefined }), opts);
    source['fixture.echo'] = () => ({ text: 'mutated' });
    policy.timeout = 1;
    policy.maxBytes.request = 1;
    policy.maxBytes.response = 1;
    expect((await (await handler(request({ ns: undefined }))).json()).payload).to.eql({
      text: 'hello',
    });
    expect((await (await direct).json()).payload).to.eql({ text: 'hello' });
    for (const name of ['constructor', 'toString', '__proto__', 'unavailable']) {
      const bad = Object.assign(
        Object.create({
          [name]: () => {
            throw new Error('inherited');
          },
        }),
        { unavailable: 42 },
      );
      const response = await HttpCmd.handle(
        request({ name }),
        options({ cmd: { ns: options().cmd.ns, handlers: bad } }),
      );
      expect(response.status).to.eql(404);
      expect(response.headers.get('cache-control')).to.eql('no-store');
      expect((await response.json()).error).to.eql('HTTP command failed.');
    }
  });

  it('sanitizes spoofed and explicitly exposed exceptions across all diagnostic properties', async () => {
    const secret = 'secret-sentinel';
    for (
      const error of [
        Object.assign(new Error(secret), {
          name: 'CmdError.Timeout',
          cause: secret,
          cmd: { name: secret },
        }),
        Object.assign(new Error(secret), {
          name: 'HttpCmdError',
          kind: 'timeout',
          dispatch: 'not-dispatched',
        }),
        Cmd.Error.expose({ name: secret, message: secret, data: { secret } }),
      ]
    ) {
      const client = HttpCmd.client({
        url: URL,
        policy: POLICY,
        fetch: () => {
          throw error;
        },
      });
      try {
        const failure = await expectFailure(
          () => client.send('private-command', { secret }),
          'network',
        );
        expect(Json.stringify(Object.getOwnPropertyDescriptors(failure))).not.to.include(secret);
      } finally {
        client.dispose();
      }
      const opts = options();
      const response = await HttpCmd.handle(request(), {
        ...opts,
        cmd: {
          ...opts.cmd,
          handlers: {
            ...opts.cmd.handlers,
            'fixture.echo': () => {
              throw error;
            },
          },
        },
      });
      const body = await response.text();
      expect(body).not.to.include(secret);
      expect(body).not.to.include('errorCause');
      expect(Json.parse<t.Cmd.Wire.Result>(body)?.error).to.eql('HTTP command failed.');
    }
  });
});
