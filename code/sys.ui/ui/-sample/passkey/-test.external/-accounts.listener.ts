import { HttpCmd } from '@sys/http/cmd';
import { describe, expect, expectError, Fs, it, Testing } from '@sys/testing/server';
import { WebFixture } from '@sys/testing/web';
import { AccountsService } from '../-service.accounts.ts';
import type { t } from '../common.ts';
import { AccountService } from '../m.Account.Service/mod.ts';
import { Accounts } from '../m.Accounts/mod.ts';

const host = '127.0.0.1';
const origin = 'http://localhost:1234';
const path = '/api/passkey/cmd';

describe('Passkey account listener', () => {
  it('binds the declared address or fails, then retires the authority and releases the port', async () => {
    await Testing.withTmpDir(async (cwd) => {
      const inspections: Inspect[] = [];
      using _capture = captureInspections(inspections);
      const blocker = Testing.Http.server();
      const { port } = blocker.addr;
      const config = Fs.join(cwd, 'accounts.yaml');
      const args = { cwd, paths: { config }, silent: true };
      try {
        await Fs.write(config, `port: ${port}\n`);
        const resources = await AccountsService.resources(args);
        expect(resources).to.eql([{ kind: 'tcp-listener', host, port }]);
        const collision = await expectError(async () => {
          await using _unexpected = await AccountsService.start(args);
        });
        expect(collision).to.be.instanceOf(Deno.errors.AddrInUse);
        expect(inspections).to.have.length(1);
        expect((await expectError(inspections[0])).message).to.eql('Account service failed.');
      } finally {
        await blocker.dispose();
      }

      const until = new AbortController();
      await using server = await AccountsService.start({ ...args, until: until.signal });
      const url = `http://${host}:${port}${path}`;
      expect(server.addr).to.include({ hostname: host, port });
      expect(server.status().urls).to.eql([{ href: url, label: 'POST' }]);
      expect(inspections).to.have.length(2);
      const inspect = inspections[1];
      expect(await inspect()).to.eql({ kind: 'accepted', value: null });
      await assertNativeRefusals(url);
      const reply = await inspectOverHttp(url);
      expect(reply).to.eql({ kind: 'accepted', value: null });

      until.abort();
      await server.finished;
      await server.close();
      expect((await expectError(inspect)).message).to.eql('Account service failed.');

      await using next = await AccountsService.start(args);
      expect(next.addr).to.include({ hostname: host, port });
    });
  });
});

type Inspect = () => Promise<t.Accounts.Result['session.inspect']>;

/** Retain a credential-free handler from each real authority, even when bind returns no handle. */
function captureInspections(inspections: Inspect[]) {
  const create = AccountService.create;
  const capture: typeof create = (options) => {
    const instance = create(options);
    const name = 'session.inspect';
    const inspect = instance.handlers({})[name];
    const { signal } = new AbortController();
    const ctx = { id: 'req-listener-proof', name, signal, emit() {} } as const;
    inspections.push(async () => await inspect({}, ctx));
    return instance;
  };
  const descriptor = { value: capture };
  return WebFixture.Property.mock([{ target: AccountService, key: 'create', descriptor }]);
}

async function inspectOverHttp(url: string) {
  using client = HttpCmd.client<t.Accounts.Name, t.Accounts.Payload, t.Accounts.Result>({
    url,
    ns: 'accounts',
    policy: { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 },
    fetch(input, init) {
      const headers = new Headers(init?.headers);
      headers.set('origin', origin); // This loopback client is not a browser.
      return fetch(input, { ...init, headers });
    },
  });
  const name = 'session.inspect';
  return Accounts.readResult(name, await client.send(name, {}));
}

async function assertNativeRefusals(url: string) {
  const preflight = await fetch(url, {
    method: 'OPTIONS',
    headers: { origin, 'access-control-request-method': 'POST' },
  });
  const neighbor = await fetch(`${url}/`, { method: 'POST', headers: { origin } });
  expect(preflight.status).to.eql(405);
  expect(preflight.headers.get('allow')).to.eql('POST');
  expect(neighbor.status).to.eql(404);
  for (const response of [preflight, neighbor]) {
    expect(response.headers.get('access-control-allow-origin')).to.eql(null);
    expect(response.headers.get('cache-control')).to.eql('no-store');
    expect(await response.text()).to.eql('');
  }
}
