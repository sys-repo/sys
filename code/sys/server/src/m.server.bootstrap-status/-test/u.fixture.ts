import { Err, expect, type t } from '../../-test.ts';
import { DEFAULT_DEPENDENCIES, startWith } from '../u/u.start.ts';

const encoder = new TextEncoder();

export const PAGE = encoder.encode('<!doctype html><title>Preparing</title><p>Preparing</p>');
export const NOT_FOUND_HTML =
  '<!doctype html><meta charset="utf-8"><title>Not Found</title><p>Not found.</p>';
export const FAILURE_HTML =
  '<!doctype html><meta charset="utf-8"><title>Unavailable</title><p>Bootstrap status is unavailable.</p>';

const POLICY_HEADERS = {
  'cache-control': 'no-store',
  'content-security-policy':
    "default-src 'none'; base-uri 'none'; child-src 'none'; connect-src 'none'; font-src 'none'; form-action 'none'; frame-ancestors 'none'; frame-src 'none'; img-src 'none'; manifest-src 'none'; media-src 'none'; object-src 'none'; script-src 'none'; style-src 'unsafe-inline'; worker-src 'none'",
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
} as const;

export function input(): t.BootstrapStatus.StartOptions<'ready'>;
export function input<K extends string>(key: K): t.BootstrapStatus.StartOptions<K>;
export function input(key = 'ready'): t.BootstrapStatus.StartOptions<string> {
  return {
    pages: [{ key, bytes: PAGE }],
    resolve: () => ({ kind: 'page', key }),
  };
}

export async function deterministicStart<K extends string>(
  options: t.BootstrapStatus.StartOptions<K>,
  character: string,
): Promise<Readonly<{ started: t.BootstrapStatus.Started; app: t.HttpServer.App }>> {
  let app: t.HttpServer.App | undefined;
  const started = await startWith(options, {
    ...DEFAULT_DEPENDENCIES,
    capability: () => character.repeat(48),
    createApp(...args) {
      app = DEFAULT_DEPENDENCIES.createApp(...args);
      return app;
    },
  });
  if (!app) throw new Error('Expected internal application.');
  return { started, app };
}

export function direct(
  app: t.HttpServer.App,
  path: string,
  host: string,
  headers: Record<string, string> = {},
  method = 'GET',
): Promise<Response> {
  return Promise.resolve(app.request(
    new Request(`http://local.invalid${path}`, {
      method,
      headers: { host, ...headers },
    }),
  ));
}

export function hostOf(started: t.BootstrapStatus.Started): string {
  return new URL(started.url).host;
}

export function assertPolicy(response: Response): void {
  for (const [name, value] of Object.entries(POLICY_HEADERS)) {
    expect([response.status, name, response.headers.get(name)]).to.eql([
      response.status,
      name,
      value,
    ]);
  }
  expect(response.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
}

export function assertLifecycleFailure(input: unknown, raw: unknown): void {
  expect(input).to.be.instanceOf(Error);
  expect((input as Error).message).to.eql('BootstrapStatus listener lifecycle failed.');
  expect(input).to.not.equal(raw);
  expect('cause' in (input as object)).to.eql(false);
}

export async function catchError(
  fn: () => unknown | Promise<unknown>,
): Promise<Error | undefined> {
  const cause = await catchCause(fn);
  return cause === undefined ? undefined : Err.normalize(cause);
}

export async function catchCause(fn: () => unknown | Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (cause) {
    return cause;
  }
}
