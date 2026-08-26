import { describe, expect, it, type t } from '../../-test.ts';
import { DEFAULT_DEPENDENCIES, startWith } from '../u/u.start.ts';
import { assertPolicy, PAGE } from './u.fixture.ts';

type PublicStartOptionKey = 'pages' | 'resolve';
type HasExactPublicStartOptionKeys =
  Exclude<keyof t.BootstrapStatus.StartOptions, PublicStartOptionKey> extends never
    ? Exclude<PublicStartOptionKey, keyof t.BootstrapStatus.StartOptions> extends never ? true
    : false
    : false;

type PublicStartedKey =
  | 'url'
  | 'finished'
  | 'disposed'
  | 'close'
  | typeof Symbol.asyncDispose
  | typeof Symbol.dispose;
type HasExactPublicStartedKeys = Exclude<keyof t.BootstrapStatus.Started, PublicStartedKey> extends
  never ? Exclude<PublicStartedKey, keyof t.BootstrapStatus.Started> extends never ? true
  : false
  : false;
type StartedIsAsyncDisposable = t.BootstrapStatus.Started extends globalThis.AsyncDisposable ? true
  : false;
type DualProtocolStarted =
  & Omit<t.BootstrapStatus.Started, typeof Symbol.dispose>
  & globalThis.Disposable;
type StartedRejectsDualProtocol = DualProtocolStarted extends t.BootstrapStatus.Started ? false
  : true;

const HAS_EXACT_PUBLIC_START_OPTION_KEYS: HasExactPublicStartOptionKeys = true;
const HAS_EXACT_PUBLIC_STARTED_KEYS: HasExactPublicStartedKeys = true;
const STARTED_IS_ASYNC_DISPOSABLE: StartedIsAsyncDisposable = true;
const STARTED_REJECTS_DUAL_PROTOCOL: StartedRejectsDualProtocol = true;

const encoder = new TextEncoder();

describe('BootstrapStatus.start/startup', () => {
  it('binds one launch-scoped capability and snapshots caller-owned pages', async () => {
    const bytes = PAGE.slice();
    const pages: t.BootstrapStatus.Page<string>[] = [{ key: 'preparing', bytes }];
    const options: t.BootstrapStatus.StartOptions<string> = {
      pages,
      resolve: () => ({ kind: 'page', key: 'preparing' }),
    };
    let internal: t.HttpServer.Started | undefined;
    const pending = startWith(options, {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        internal = DEFAULT_DEPENDENCIES.startHttp(...args);
        return internal;
      },
    });
    bytes.fill(0);
    pages[0]!.key = 'changed';
    pages.push({ key: 'later', bytes: encoder.encode('later') });
    options.resolve = () => ({ kind: 'page', key: 'later' });
    const started = await pending;
    if (!internal) throw new Error('Expected internal listener.');

    try {
      const url = new URL(started.url);
      expect(url.origin).to.eql(internal.origin);
      expect(url.pathname).to.match(/^\/[0-9a-z]{48}$/);
      expect(url.search).to.eql('');
      expect(url.hash).to.eql('');
      expect(internal.status().urls).to.eql([{ href: `${url.origin}/` }]);
      expect(HAS_EXACT_PUBLIC_START_OPTION_KEYS).to.eql(true);
      expect(HAS_EXACT_PUBLIC_STARTED_KEYS).to.eql(true);
      expect(STARTED_IS_ASYNC_DISPOSABLE).to.eql(true);
      expect(STARTED_REJECTS_DUAL_PROTOCOL).to.eql(true);
      const asyncDisposable: globalThis.AsyncDisposable = started;
      expect(asyncDisposable).to.equal(started);
      expect(Reflect.ownKeys(started)).to.eql([
        'url',
        'finished',
        'disposed',
        'close',
        Symbol.asyncDispose,
      ]);
      expect(Object.isFrozen(started)).to.eql(true);
      expect(started).to.not.equal(internal);
      expect(
        ['app', 'server', 'signal', 'status', 'origin', 'port', 'dispose', 'dispose$'].some((key) =>
          key in started
        ),
      ).to.eql(false);
      expect(Symbol.asyncDispose in started).to.eql(true);
      expect(Symbol.dispose in started).to.eql(false);

      const get = await fetch(started.url);
      expect(get.status).to.eql(200);
      expect(await get.text()).to.eql(new TextDecoder().decode(PAGE));
      expect(get.headers.get('content-length')).to.eql(String(PAGE.byteLength));
      assertPolicy(get);

      const head = await fetch(started.url, { method: 'HEAD' });
      expect(head.status).to.eql(200);
      expect(await head.text()).to.eql('');
      expect(head.headers.get('content-length')).to.eql(String(PAGE.byteLength));
      assertPolicy(head);
    } finally {
      await started.close('test.cleanup');
    }
  });
});
