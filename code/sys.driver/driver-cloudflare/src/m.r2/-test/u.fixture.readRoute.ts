import { expect, type t, Testing, WebFixture } from '../../-test.ts';
import { R2 } from '../mod.ts';
import { accountId } from './u.fixture.ts';

export const origin = R2.Service.storageUrl(accountId);
export const secret = 'signed-query-SECRET';

/** Create a handler with observable authorization and signing, without mocking Fetch. */
export function setup(overrides: Partial<t.R2.ReadRoute.CreateOptions> = {}) {
  const signed: string[] = [];
  const authorized: string[] = [];
  const options: t.R2.ReadRoute.CreateOptions = {
    bucket: {
      name: 'assets',
      presignGet(key) {
        signed.push(key);
        const path = key.split('/').map(encodeURIComponent).join('/');
        return Promise.resolve(`${origin}/assets/${path}?token=${secret}`);
      },
    },
    storageOrigin: origin,
    routes: { '/': 'index.html', '/assets/app.js': 'bundle/app.js', '/data.bin': 'data.bin' },
    limits: { maxBytes: 8, timeout: 1000, maxConcurrent: 1 },
    authorize({ key }) {
      authorized.push(key);
      return true;
    },
    ...overrides,
  };
  return { handler: R2.ReadRoute.create(options), signed, authorized, options };
}

export function request(path: string, init?: RequestInit): Request {
  return new Request(`https://app.example${path}`, init);
}

/** Record forbidden fetches even when the handler catches the error. */
export function forbidFetch() {
  let calls = 0;
  const mock = WebFixture.Fetch.mock(() => {
    calls++;
    throw new Error('Unexpected fetch');
  });
  return {
    get calls() {
      return calls;
    },
    dispose: () => mock.dispose(),
    [Symbol.dispose]: () => mock.dispose(),
  };
}

/** Retry saturation only; the first other response or rejection decides the assertion. */
export async function expectRecovery(handler: t.R2.ReadRoute.Handler) {
  let response: Response | undefined;
  let rejected = false;
  let error: unknown;
  await Testing.until(async () => {
    try {
      response = await handler(request('/'));
      return response.status !== 503;
    } catch (cause) {
      rejected = true;
      error = cause;
      return true;
    }
  });
  // Polling retries thrown errors, so propagate failures and assert only after it stops.
  if (rejected) throw error;
  expect(response?.status, 'recovered request status').to.eql(200);
  expect(await response?.text(), 'recovered request body').to.eql('ok');
}

/** Response policy is observable here; caller authorization is proved separately. */
export function expectResponsePolicy(response: Response) {
  expect(response.headers.get('cache-control')).to.eql('no-store');
  expect(response.headers.get('x-content-type-options')).to.eql('nosniff');
}
