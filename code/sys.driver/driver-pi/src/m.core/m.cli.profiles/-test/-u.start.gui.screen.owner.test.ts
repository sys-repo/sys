import { describe, expect, it, WebFixture } from '../../../-test.ts';
import { Cli, Fs, type t } from '../common.ts';
import { StartGuiScreen } from '../u.start/u.screen.ts';
import { Boot, createBootState } from '../u.start/u.state.ts';
import {
  APPLICATION,
  CAPABILITY,
  createScreenHarness,
  DEVELOPMENT_ROOT,
  SERVICE,
} from './u.fixture.start.gui.screen.ts';

const stringIteratorPrototype = Object.getPrototypeOf('screen'[Symbol.iterator]());
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const segmentIteratorPrototype = Object.getPrototypeOf(
  segmenter.segment('screen')[Symbol.iterator](),
);

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

    state.set(Boot.ready(APPLICATION.URL));
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
      state.set(Boot.ready(APPLICATION.URL));
    }

    const frame = harness.frames.at(-1) ?? '';
    const text = Cli.stripAnsi(frame);
    expect(ambientCalls).to.eql(0);
    expect(text).to.contain(CAPABILITY.DISPLAY);
    expect(text).to.contain(APPLICATION.DISPLAY);
    expect(text).to.not.contain('127.0.0.1');
    expect(frame).to.contain(CAPABILITY.URL);
    expect(frame).to.contain(APPLICATION.URL);
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

  it('fails closed before mutated collection or string presentation methods run', () => {
    const cases: readonly Readonly<{ target: object; key: PropertyKey; label: string }>[] = [
      { target: String.prototype, key: 'slice', label: 'String.slice' },
      { target: String.prototype, key: 'codePointAt', label: 'String.codePointAt' },
      { target: stringIteratorPrototype, key: 'next', label: 'StringIterator.next' },
      { target: Array.prototype, key: 'some', label: 'Array.some' },
      { target: Set.prototype, key: Symbol.iterator, label: 'Set.iterator' },
      { target: Number, key: 'isSafeInteger', label: 'Number.isSafeInteger' },
      { target: Math, key: 'abs', label: 'Math.abs' },
      { target: Intl.Segmenter.prototype, key: 'segment', label: 'Intl.Segmenter.segment' },
      { target: segmentIteratorPrototype, key: 'next', label: 'SegmentIterator.next' },
    ];

    for (const fixture of cases) {
      const descriptor = Object.getOwnPropertyDescriptor(fixture.target, fixture.key);
      if (!descriptor) throw new Error(`Expected ${fixture.label} descriptor.`);
      const state = createBootState();
      const harness = createScreenHarness({ width: 100, height: 18 });
      let failures = 0;
      const screen = StartGuiScreen.create({
        service: SERVICE,
        url: CAPABILITY.URL,
        state,
        keyboard: true,
        onFailure() {
          failures += 1;
        },
      }, harness.deps);
      let ambientCalls = 0;

      {
        using _mock = WebFixture.Property.mock([{
          target: fixture.target,
          key: fixture.key,
          descriptor: {
            ...descriptor,
            value() {
              ambientCalls += 1;
              throw new Error(`ambient ${fixture.label} invoked`);
            },
          },
        }]);
        state.set(Boot.startingAppHost);
      }

      expect({ label: fixture.label, ambientCalls, failures, frames: harness.frames.length }).to
        .eql({
          label: fixture.label,
          ambientCalls: 0,
          failures: 1,
          frames: 1,
        });
      screen.dispose();
    }
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
    screen.warnOpen();
    screen.dispose();
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
  expect(footer.startsWith('← + ctrl')).to.eql(true);
  expect(footer.endsWith('quit: ctrl + c or q')).to.eql(true);
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
