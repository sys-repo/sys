import { HttpCmd } from '@sys/http/cmd';
import { describe, expect, it } from '../../-test.ts';
import { type t, Time } from '../common.ts';
import { AccountService } from '../m.AccountService/mod.ts';
import { Accounts } from '../m.Accounts/mod.ts';
import { accountRequest } from '../u/u.accounts.request.ts';

const origin = 'http://localhost:1234';
const path = '/api/passkey/cmd';
const policy = { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 };

const options = {
  rp: { id: 'localhost', name: 'Reference accounts' },
  origins: [origin],
  algorithms: [-7],
  lifetimes: { challenge: 60_000, session: 300_000 },
  capacity: { accounts: 2, credentials: 4, transactions: 2, sessions: 2 },
};

describe('Passkey account request binding', () => {
  it('admits one exact route and preserves a correlated domain result', async () => {
    using service = AccountService.create(options);
    const credentials: Array<t.Accounts.Authority['credential']> = [];
    const handle = accountRequest({
      origin,
      policy,
      handlers(authority) {
        credentials.push(authority.credential);
        return service.handlers(authority);
      },
    });
    using client = HttpCmd.client<t.Accounts.Name, t.Accounts.Payload, t.Accounts.Result>({
      url: `${origin}${path}`,
      ns: 'accounts',
      policy,
      fetch(input, init) {
        const headers = new Headers(init?.headers);
        headers.set('origin', origin); // Fixture for the server binding, not browser proof.
        return Promise.resolve(handle(new Request(input, { ...init, headers })));
      },
    });

    const inspect = () => client.send('session.inspect', {});
    const anonymous = Accounts.readResult('session.inspect', await inspect());
    expect(anonymous).to.eql({ kind: 'accepted', value: null });
    await client.send('session.inspect', {}, { headers: { authorization: 'bEaReR sample_token' } });
    await inspect();
    expect(credentials).to.eql([undefined, 'sample_token', undefined]);
  });

  it('rejects wrong paths, methods, origins, and malformed bearer headers before binding handlers', async () => {
    let calls = 0;
    const handle = accountRequest({
      origin,
      policy,
      handlers() {
        calls++;
        throw new Error('Unexpected account handler binding');
      },
    });
    const denied: Array<RequestInit & { url: string; status: number }> = [
      { url: `${path}/`, method: 'POST', headers: { origin }, status: 404 },
      { url: path, method: 'GET', headers: { origin }, status: 405 },
      { url: path, method: 'OPTIONS', headers: { origin }, status: 405 },
      { url: path, method: 'POST', status: 403 },
      { url: path, method: 'POST', headers: { origin: 'null' }, status: 403 },
      { url: path, method: 'POST', headers: { origin: 'http://localhost:5051' }, status: 403 },
      {
        url: path,
        method: 'POST',
        headers: { origin, authorization: 'Bearer first, Bearer second' },
        status: 400,
      },
    ];
    for (const { url, method, headers, status } of denied) {
      const response = await handle(new Request(`${origin}${url}`, { method, headers }));
      expect(response.status).to.eql(status);
      expect(response.headers.get('cache-control')).to.eql('no-store');
      expect(response.headers.get('access-control-allow-origin')).to.eql(null);
      expect(response.headers.get('allow')).to.eql(status === 405 ? 'POST' : null);
      expect(await response.text()).to.eql('');
    }
    expect(calls).to.eql(0);
  });

  it('wrong origin + open body → 403 without reading or waiting for cancellation', async () => {
    const release = Promise.withResolvers<void>();
    const effects: string[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        effects.push('read');
        return release.promise.then(() => controller.close());
      },
      cancel() {
        effects.push('cancel');
        return release.promise;
      },
    }, { highWaterMark: 0 }); // Only a reader can trigger pull; the stream cannot prefetch.
    const handle = accountRequest({
      origin,
      policy,
      handlers() {
        effects.push('bind');
        throw new Error('Unexpected account handler binding');
      },
    });
    const headers = { origin: 'http://localhost:5051' };
    const request = new Request(`${origin}${path}`, { method: 'POST', headers, body });
    try {
      const refusal = handle(request);
      const response = await Time.waitFor(() => refusal);
      expect(response.status).to.eql(403);
      expect(effects).to.eql(['cancel']);
    } finally {
      release.resolve();
    }
  });
});
