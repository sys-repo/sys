import { HttpCmd } from '@sys/http/cmd';
import { Browser, describe, expect, Fs, it, Testing } from '@sys/testing/server';
import {
  BUNDLE_NAME,
  Echo,
  type Name,
  type Payload,
  Receipt,
  type Result,
  SCRATCH,
} from './u.fixture.ts';

describe('HttpCmd in Chrome', () => {
  it('delivers one command and returns a correlated echo', async () => {
    const root = Fs.resolve(SCRATCH);
    if (Deno.args.length !== 1) throw new Error('Expected one admitted Chrome executable path.');
    const executablePath = await Browser.Executable.admit(Deno.args[0], { writableRoots: [root] });
    const chrome = await Deno.permissions.query({ name: 'run', command: executablePath });
    const deno = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
    expect(chrome.state).to.eql('granted');
    expect(deno.state).not.to.eql('granted');
    const bundlePath = Fs.join(root, BUNDLE_NAME);
    const { data: bundle, error } = await Fs.readText(bundlePath);
    if (bundle === undefined) {
      throw new Error(`Could not read prepared browser page: ${bundlePath}`, { cause: error });
    }
    const requests: Array<{
      method: string;
      origin: string | null;
      referer: boolean;
      cookie: boolean;
      authorization: boolean;
    }> = [];
    const invocations: string[] = [];
    const receipt = crypto.randomUUID();
    let observations = 0;

    const server = Testing.Http.server((req) => {
      const { pathname } = new URL(req.url);
      const { method, headers } = req;
      if (pathname === Echo.path) {
        requests.push({
          method,
          origin: headers.get('origin'),
          referer: headers.has('referer'),
          cookie: headers.has('cookie'),
          authorization: headers.has('authorization'),
        });
        if (headers.get('origin') !== origin) return new Response(null, { status: 403 });
        return HttpCmd.handle<Name, Payload, Result>(req, {
          path: Echo.path,
          policy: Echo.policy,
          cmd: {
            ns: Echo.ns,
            handlers: {
              [Echo.name]: ({ text }) => {
                invocations.push(text);
                return { text, receipt };
              },
            },
          },
        });
      }

      if (pathname === Receipt.path && method === 'POST') {
        if (headers.get('origin') !== origin || headers.get(Receipt.header) !== receipt) {
          return new Response(null, { status: 403 });
        }
        observations++;
        return new Response(null, { status: 204 });
      }

      if (method === 'GET' && pathname === '/page.js') {
        return new Response(bundle, { headers: { 'content-type': 'text/javascript' } });
      }
      if (method === 'GET' && pathname === '/') {
        return new Response(
          '<!doctype html><link rel="icon" href="data:,"><script type="module" src="/page.js"></script>',
          { headers: { 'content-type': 'text/html; charset=utf-8' } },
        );
      }
      return new Response(null, { status: 404 });
    });
    const origin = server.url.toURL().origin;

    try {
      const browser = await Browser.load(origin, { executablePath, waitAfterLoad: 2_000 });
      if (!browser.ok) throw new Error(`Browser echo page failed:\n${browser.errors.join('\n')}`);
      expect(requests).to.eql([{
        method: 'POST',
        origin,
        referer: false,
        cookie: false,
        authorization: false,
      }]);
      expect(invocations).to.eql([Echo.text]);
      expect(observations).to.eql(1);
      console.info(
        `One command POST, Origin: ${origin}, no Referer, Cookie, or Authorization; one handler and one browser-verified correlated echo.`,
      );
    } finally {
      await server.dispose();
    }

    // Leave the prepared page and any launcher residue available on failure.
    expect(await Fs.remove(bundlePath, { recursive: false })).to.eql(true);
  });
});
