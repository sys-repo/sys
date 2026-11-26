import type { Cell } from '@sys/cell/t';
import { Fs } from '@sys/fs';
import { create, start } from '@sys/http/server/host';
import { Net } from '@sys/net';
import { Is, Obj } from './common.ts';
import { AccountService } from './m.Account.Service/mod.ts';
import { accountRequest } from './u/u.accounts.request.ts';
import { browserOrigin, rp } from './u/u.issuer.ts';
import { ROUTE } from './u/u.routes.ts';

const hostname = '127.0.0.1';
const transportPolicy = { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 };

/** Cell-local lifecycle endpoint for the reference account command service. */
export const AccountsService = {
  async resources({ paths }) {
    const port = await readPort(paths.config);
    return [{ kind: 'tcp-listener', host: hostname, port }];
  },

  async start({ paths, silent, until }) {
    const port = await readPort(paths.config);
    if (Is.abortSignal(until)) until.throwIfAborted();
    const authority = AccountService.create({
      rp,
      origins: [browserOrigin],
      algorithms: [-7, -8, -257],
      lifetimes: { challenge: 60_000, session: 300_000 },
      capacity: { accounts: 100, credentials: 200, transactions: 100, sessions: 200 },
    });
    try {
      const app = create();
      const handle = accountRequest({
        origin: browserOrigin,
        policy: transportPolicy,
        handlers: authority.handlers,
      });
      app.all('*', (context) => handle(context.req.raw));
      const server = start(app, {
        hostname,
        port,
        strictPort: true,
        origin: 'exact-loopback',
        silent,
        until,
        status: {
          kind: 'accounts:http',
          config: paths.config,
          urlPaths: [{ path: ROUTE.ACCOUNT.commandPath, label: 'POST' }],
        },
      });
      server.signal.addEventListener('abort', () => authority.dispose(), { once: true });
      return server;
    } catch (cause) {
      authority.dispose();
      throw cause;
    }
  },
} satisfies Cell.Services.LifecycleEndpoint;

async function readPort(path: string) {
  const { ok, data, errorReason } = await Fs.readYaml<unknown>(path);
  if (!ok) throw new Error(`Passkey accounts config (${errorReason ?? 'Unknown'}): ${path}`);
  if (!Is.record(data) || Obj.keys(data).some((key) => key !== 'port')) {
    throw new Error(`Expected a config with only a 'port' field: ${path}`);
  }
  const { port } = data;
  if (!Net.Port.isFixed(port)) throw new Error(`Expected a fixed TCP port (1..65535): ${path}`);
  return port;
}
