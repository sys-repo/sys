import { describe, expect, it, type TBootstrapStatus as BootstrapStatus } from '../../../-test.ts';
import { pkg, type t } from '../common.ts';
import { projectBootstrap, startBootstrap } from '../u.start/u.bootstrap.ts';
import { Boot, type BootFailureCategory, createBootState } from '../u.start/u.state.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';
import { bootstrapStatusFixture } from './u.fixture.start.gui.ts';

const APP_ORIGIN = 'http://127.0.0.1:47001' as t.StringUrl;
const STATUS_URL = 'http://127.0.0.1:47000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl;
const APPLICATION_NAME = `${pkg.name}/ui`;
const DUPLICATED_APPLICATION_NAME = `${APPLICATION_NAME}/ui`;

describe('@sys/driver-pi start:gui bootstrap projection', () => {
  it('passes exactly finite pages and one resolver to the generic status host', async () => {
    const state = createBootState();
    let options: BootstrapStatus.StartOptions<string> | undefined;
    const start = <K extends string>(
      input: BootstrapStatus.StartOptions<K>,
    ): Promise<BootstrapStatus.Started> => {
      options = input as BootstrapStatus.StartOptions<string>;
      return Promise.resolve(bootstrapStatusFixture({ url: STATUS_URL }));
    };

    const started = await startBootstrap(state, start);
    expect(started.url).to.eql(STATUS_URL);
    expect(Reflect.ownKeys(options ?? {})).to.eql(['pages', 'resolve']);
    expect(options?.pages.map((page) => page.key)).to.eql([
      'preparing',
      'starting-app-host',
      'failed-configuration-invalid',
      'failed-source-unavailable',
      'failed-artifact-refused',
      'failed-repair-required',
      'failed-local-failure',
      'failed-cancelled',
      'stopping',
    ]);

    const decoder = new TextDecoder();
    for (const page of options?.pages ?? []) {
      const html = decoder.decode(page.bytes);
      expect(page.bytes.byteLength).to.be.lessThan(256 * 1024);
      expect(html).to.contain('<!doctype html>');
      expect(html).to.contain(APPLICATION_NAME);
      expect(html).to.not.contain(DUPLICATED_APPLICATION_NAME);
      expect(html).to.contain('font-family:sans-serif');
      expect(html).to.contain('padding:30px');
      expect(html).to.contain('font-size:inherit;line-height:inherit;font-weight:700');
      expect(html).to.contain('font-size:inherit;line-height:inherit;font-weight:400');
      expect(html).to.not.contain('Driver Pi');
      expect(html).to.not.contain('<script');
      expect(html).to.not.contain('<form');
      expect(html).to.not.contain(START_GUI_SERVICE.source.integrity);
      expect(html).to.not.contain(START_GUI_SERVICE.source.manifestUrl);
    }
    const pages = new Map((options?.pages ?? []).map((page) => [
      page.key,
      decoder.decode(page.bytes),
    ]));
    expect(pages.get('preparing')).to.contain('http-equiv="refresh"');
    expect(pages.get('starting-app-host')).to.contain('http-equiv="refresh"');
    expect(pages.get('stopping')).to.not.contain('http-equiv="refresh"');
    expect(pages.get('failed-local-failure')).to.not.contain('http-equiv="refresh"');
    expect(pages.get('failed-repair-required')).to.contain(
      `<title>${APPLICATION_NAME} repair required</title>`,
    );
    expect(pages.get('failed-repair-required')).to.contain(
      `>${APPLICATION_NAME} could not start</h1>`,
    );

    const firstByte = options?.pages[0]?.bytes[0];
    if (options?.pages[0]) options.pages[0].bytes[0] = 0;
    await startBootstrap(state, start);
    expect(options?.pages[0]?.bytes[0]).to.eql(firstByte);
    await started.close();
  });

  it('uses one truthful async-disposable fixture lifecycle', async () => {
    let closeReason: unknown = 'not-called';
    const started = bootstrapStatusFixture({
      url: STATUS_URL,
      close(reason) {
        closeReason = reason;
      },
    });

    expect(started.disposed).to.eql(false);
    expect(started[Symbol.asyncDispose].length).to.eql(0);
    const disposing = Reflect.apply(
      started[Symbol.asyncDispose] as (...args: unknown[]) => Promise<void>,
      started,
      ['symbol-reason'],
    );
    expect(started.close('owner-reason')).to.equal(disposing);
    expect(started[Symbol.asyncDispose]()).to.equal(disposing);
    await disposing;
    await started.finished;
    expect({ closeReason, disposed: started.disposed }).to.eql({
      closeReason: undefined,
      disposed: true,
    });
  });

  it('memoizes fixture closure before synchronous cleanup re-entry', async () => {
    let nested: Promise<void> | undefined;
    let reentered = false;
    const reasons: unknown[] = [];

    const started = bootstrapStatusFixture({
      url: STATUS_URL,
      close(reason) {
        reasons.push(reason);
        if (!reentered) {
          reentered = true;
          nested = started.close('nested');
        }
      },
    });

    const outer = started.close('outer');
    const protocol = started[Symbol.asyncDispose]();
    expect(nested).to.equal(outer);
    expect(protocol).to.equal(outer);
    expect(started.close('later')).to.equal(outer);
    await outer;
    await started.finished;
    expect({ reasons, disposed: started.disposed }).to.eql({
      reasons: ['outer'],
      disposed: true,
    });
  });

  it('redirects on the first observation when readiness settled before any request', () => {
    const state = createBootState();
    state.set(Boot.startingAppHost);
    state.set(Boot.ready(APP_ORIGIN));

    expect(projectBootstrap(state)).to.eql({ kind: 'redirect', origin: APP_ORIGIN });
  });

  it('maps every browser-safe category to one fixed page without safe evidence', () => {
    const categories: readonly BootFailureCategory[] = [
      'configuration-invalid',
      'source-unavailable',
      'artifact-refused',
      'repair-required',
      'local-failure',
      'cancelled',
    ];

    for (const category of categories) {
      const state = createBootState();
      state.set(Boot.failed(
        category,
        Object.freeze({
          kind: 'local',
          operation: 'application-host',
        }),
      ));
      const projection = projectBootstrap(state);
      expect(projection).to.eql({ kind: 'page', key: `failed-${category}` });
      expect(Reflect.ownKeys(projection)).to.eql(['kind', 'key']);
    }
  });
});
