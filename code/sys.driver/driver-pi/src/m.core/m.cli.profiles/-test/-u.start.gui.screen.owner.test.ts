import { describe, expect, it, WebFixture } from '../../../-test.ts';
import { Cli, Fs, type t } from '../common.ts';
import { StartGuiScreen } from '../u.start/u.screen/mod.ts';
import { Boot, createBootState } from '../u.start/u.state.ts';
import { DIST_DIGEST, GENERATION_HREF } from './u.fixture.start.gui.ts';
import {
  APPLICATION,
  CAPABILITY,
  createScreenHarness,
  DEVELOPMENT_ROOT,
  SERVICE,
} from './u.fixture.start.gui.screen.ts';

describe('@sys/driver-pi start:gui screen ownership', () => {
  it('repaints one boot state at initial, transitioned, and resized viewport widths', () => {
    const state = createBootState();
    const harness = createScreenHarness({ width: 80, height: 24 });
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state,
      keyboard: true,
      onFailure() {},
    }, harness.deps);

    expect(harness.frames).to.have.length(1);
    expectFrame(harness.frames[0] ?? '', { width: 80, height: 24 }, 'preparing');

    state.set(Boot.startingAppHost);
    expect(harness.frames).to.have.length(2);
    expect(Cli.stripAnsi(harness.frames[1] ?? '')).to.contain('starting application host');

    state.set(Boot.ready(APPLICATION.URL, DIST_DIGEST, GENERATION_HREF));
    expect(harness.frames).to.have.length(3);
    expect(Cli.stripAnsi(harness.frames[2] ?? '')).to.contain('ready');
    expect(Cli.stripAnsi(harness.frames[2] ?? '')).to.contain(APPLICATION.DISPLAY);
    expect(harness.frames[2] ?? '').to.contain(CAPABILITY.URL);

    harness.resize({ width: 48, height: 18 });
    expect(harness.frames).to.have.length(4);
    expectFrameBounds(harness.frames[3] ?? '', { width: 48, height: 18 });

    screen.dispose();
    screen.dispose();
    expect(harness.releases).to.eql(1);

    harness.resize({ width: 36, height: 12 });
    screen.redraw();
    expect(harness.frames).to.have.length(4);
  });

  it('repaints localhost display with exact links through captured URL authority', () => {
    const NativeURL = URL;
    const state = createBootState();
    const harness = createScreenHarness({ width: 100, height: 18 });
    let failures = 0;
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      root: DEVELOPMENT_ROOT,
      state,
      keyboard: true,
      onFailure() {
        failures += 1;
      },
    }, harness.deps);
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'URL');
    if (!descriptor) throw new Error('Expected global URL descriptor.');
    let ambientCalls = 0;
    state.set(Boot.startingAppHost);

    {
      using _mock = WebFixture.Property.mock([{
        target: globalThis,
        key: 'URL',
        descriptor: {
          ...descriptor,
          value: class {
            constructor() {
              ambientCalls += 1;
              throw new Error('ambient URL invoked during screen repaint');
            }
          },
        },
      }]);
      state.set(Boot.ready(APPLICATION.URL, DIST_DIGEST, GENERATION_HREF));
    }

    const frame = harness.frames.at(-1) ?? '';
    const text = Cli.stripAnsi(frame);
    expect(ambientCalls).to.eql(0);
    expect(text).to.contain(CAPABILITY.DISPLAY);
    expect(text).to.contain(APPLICATION.DISPLAY);
    expect(text).to.not.contain('127.0.0.1');
    expect(frame).to.contain(CAPABILITY.URL);
    expect(frame).to.contain(APPLICATION.URL);
    expect(frame).to.contain(GENERATION_HREF);
    expect(frame).to.contain(Fs.Path.toFileUrl(DEVELOPMENT_ROOT).href);

    const hrefDescriptor = Object.getOwnPropertyDescriptor(NativeURL.prototype, 'href');
    if (!hrefDescriptor?.get) throw new Error('Expected URL.prototype.href getter.');
    let getterCalls = 0;
    {
      using _mock = WebFixture.Property.mock([{
        target: NativeURL.prototype,
        key: 'href',
        descriptor: {
          ...hrefDescriptor,
          get() {
            getterCalls += 1;
            throw new Error('ambient URL getter invoked during screen repaint');
          },
        },
      }]);
      state.set(Boot.stopping);
    }

    expect({ getterCalls, failures }).to.eql({ getterCalls: 0, failures: 0 });
    screen.dispose();
  });

  it('captures development file authority before screen callbacks mutate URL prototypes', () => {
    const NativeURL = URL;
    const hrefDescriptor = Object.getOwnPropertyDescriptor(NativeURL.prototype, 'href');
    if (!hrefDescriptor?.get) throw new Error('Expected URL.prototype.href getter.');
    const expected = Fs.Path.toFileUrl(DEVELOPMENT_ROOT).href;
    const harness = createScreenHarness({ width: 100, height: 18 });
    let getterCalls = 0;
    let screen: ReturnType<typeof StartGuiScreen.create> | undefined;

    try {
      screen = StartGuiScreen.create({
        service: SERVICE,
        url: CAPABILITY.URL,
        root: DEVELOPMENT_ROOT,
        state: createBootState(),
        keyboard: false,
        onFailure() {},
      }, {
        ...harness.deps,
        isInteractive() {
          Object.defineProperty(NativeURL.prototype, 'href', {
            ...hrefDescriptor,
            get() {
              getterCalls += 1;
              throw new Error('ambient URL getter invoked after root capture');
            },
          });
          return true;
        },
      });
    } finally {
      Object.defineProperty(NativeURL.prototype, 'href', hrefDescriptor);
    }

    if (!screen) throw new Error('Expected screen instance.');
    expect(screen.kind).to.eql('acquired');
    expect(getterCalls).to.eql(0);
    expect(harness.frames.at(-1) ?? '').to.contain(expected);
    screen.dispose();
  });

  it('maps unavailable CLI formatting authority to its owned screen failure', async () => {
    const key = Symbol.iterator;
    const descriptor = Object.getOwnPropertyDescriptor(Set.prototype, key);
    if (!descriptor) throw new Error('Expected Set.prototype iterator descriptor.');
    const state = createBootState();
    const harness = createScreenHarness({ width: 100, height: 18 });
    const published: unknown[] = [];
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state,
      keyboard: true,
      onFailure(cause) {
        published[published.length] = cause;
      },
    }, harness.deps);
    let ambientCalls = 0;

    {
      using _mock = WebFixture.Property.mock([{
        target: Set.prototype,
        key,
        descriptor: {
          ...descriptor,
          value() {
            ambientCalls += 1;
            throw new Error('ambient Set iterator invoked');
          },
        },
      }]);
      state.set(Boot.startingAppHost);
    }

    const failure = await screen.failure.catch((cause) => cause);
    expect({
      ambientCalls,
      failures: published.length,
      frames: harness.frames.length,
      published: (published[0] as Error).message,
      failure: (failure as Error).message,
    }).to.eql({
      ambientCalls: 0,
      failures: 1,
      frames: 1,
      published: 'start:gui screen presentation authority unavailable.',
      failure: 'start:gui screen failed.',
    });
    screen.dispose();
    screen.dispose();
    expect(harness.releases).to.eql(1);
  });

  it('owns acquisition failure when a screen dependency invalidates Promise transport', () => {
    const state = createBootState();
    const harness = createScreenHarness({ width: 80, height: 24 });
    const descriptor = Object.getOwnPropertyDescriptor(Promise.prototype, 'constructor');
    if (!descriptor) throw new Error('Expected Promise.prototype.constructor descriptor.');
    let constructorReads = 0;
    let failures = 0;
    let screen: ReturnType<typeof StartGuiScreen.create> | undefined;

    try {
      screen = StartGuiScreen.create({
        service: SERVICE,
        url: CAPABILITY.URL,
        state,
        keyboard: true,
        onFailure() {
          failures += 1;
        },
      }, {
        ...harness.deps,
        size() {
          Object.defineProperty(Promise.prototype, 'constructor', {
            configurable: true,
            get() {
              constructorReads += 1;
              throw new Error('screen Promise constructor invoked');
            },
          });
          throw new Error('screen size failed');
        },
      });
    } finally {
      Object.defineProperty(Promise.prototype, 'constructor', descriptor);
    }

    if (!screen) throw new Error('Expected failed screen ownership.');
    expect(screen.kind).to.eql('failed');
    expect(failures).to.eql(1);
    expect(constructorReads).to.eql(0);
    screen.dispose();
  });

  it('returns retryable cleanup authority without masking initial repaint failure', async () => {
    const repaintFailure = new Error('initial repaint failed');
    const releaseFailure = new Error('release failed');
    const harness = createScreenHarness(
      { width: 80, height: 24 },
      true,
      {
        releaseError: releaseFailure,
        repaint: () => {
          throw repaintFailure;
        },
      },
    );
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state: createBootState(),
      keyboard: true,
      onFailure() {},
    }, harness.deps);

    const failure = await screen.failure.catch((cause) => cause);
    expect(screen.kind).to.eql('failed');
    expect(failure).not.to.equal(repaintFailure);
    expect((failure as Error).message).to.eql('start:gui screen failed.');
    expect(harness.releases).to.eql(1);

    let cleanupThrown: unknown;
    try {
      screen.dispose();
    } catch (cause) {
      cleanupThrown = cause;
    }
    expect(cleanupThrown).not.to.equal(releaseFailure);
    expect((cleanupThrown as Error).message).to.eql('start:gui screen cleanup failed.');
    expect(harness.releases).to.eql(2);
  });

  it('publishes redraw failure once and leaves the failed reporter inert', async () => {
    const repaintFailure = new Error('redraw repaint failed');
    const harness = createScreenHarness(
      { width: 80, height: 24 },
      true,
      {
        repaint: (_frame, count) => {
          if (count === 2) throw repaintFailure;
        },
      },
    );
    const published: unknown[] = [];
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state: createBootState(),
      keyboard: true,
      onFailure: (cause) => published.push(cause),
    }, harness.deps);

    screen.redraw();
    const failure = await screen.failure.catch((cause) => cause);
    screen.redraw();

    expect(screen.kind).to.eql('acquired');
    expect(harness.frames).to.have.length(2);
    expect(harness.releases).to.eql(1);
    expect(published).to.have.length(1);
    expect((published[0] as Error).message).to.eql('start:gui screen failed.');
    expect((failure as Error).message).to.eql('start:gui screen failed.');
    screen.dispose();
  });

  it('returns explicit unavailability when terminal screen ownership is absent', () => {
    const harness = createScreenHarness({ width: 80, height: 24 }, false);
    const state = createBootState();
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state,
      keyboard: false,
      onFailure() {},
    }, harness.deps);

    const another = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state,
      keyboard: false,
      onFailure() {},
    }, harness.deps);

    expect({ first: screen.kind, second: another.kind }).to.eql({
      first: 'unavailable',
      second: 'unavailable',
    });
    expect(screen.failure).not.to.equal(another.failure);
    state.set(Boot.startingAppHost);
    screen.redraw();
    screen.warnOpen();
    screen.dispose();
    screen.redraw();
    another.redraw();
    another.dispose();
    expect(harness.frames).to.eql([]);
    expect(harness.releases).to.eql(0);
  });
});

/**
 * Helpers:
 */
type ScreenSize = t.Cli.Screen.Size;

function expectFrame(frame: string, viewport: ScreenSize, state: string) {
  const width = viewport.width;
  const text = Cli.stripAnsi(frame);
  const rows = text.split('\n');
  const serviceRows = rows.filter((row) =>
    /^ {2}(service| state| open| app| evidence)\b/.test(row)
  );
  const footer = rows.find((row) => row.includes('quit:')) ?? '';

  expect(text).to.contain('@sys/driver-pi');
  expect(text).to.contain('service');
  expect(text).to.contain(SERVICE);
  expect(text).to.contain(state);
  if (width >= 87) expect(text).to.contain(CAPABILITY.DISPLAY);
  expect(text).to.not.contain('start:gui');
  expect(serviceRows).to.have.length(3);
  for (const row of serviceRows) {
    expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(width - 2);
  }
  expect(footer.startsWith('← ctrl')).to.eql(true);
  expect(footer.endsWith('quit: q')).to.eql(true);
  expect(Cli.Fmt.Text.Width.measure(footer)).to.eql(width);
  expectFrameBounds(frame, viewport);
}

function expectFrameBounds(frame: string, viewport: ScreenSize) {
  const text = Cli.stripAnsi(frame);
  const rows = text ? text.split('\n') : [];
  expect(rows.length).to.be.at.most(Math.max(0, viewport.height - 1));
  for (const row of rows) {
    expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(viewport.width);
  }
}
