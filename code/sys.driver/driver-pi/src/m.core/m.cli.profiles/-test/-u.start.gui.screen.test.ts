import { describe, expect, it, WebFixture } from '../../../-test.ts';
import { c, Cli, type t } from '../common.ts';
import { observeResizeWith, StartGuiScreen } from '../u.start/u.screen.ts';
import { Boot, createBootState } from '../u.start/u.state.ts';
import { createScreenHarness } from './u.fixture.start.gui.screen.ts';

const SERVICE = 'sys.ui:pi';
const CAPABILITY_ORIGIN = 'http://127.0.0.1:51260';
const CAPABILITY_SUFFIX = '/0123456789abcdefghijklmnopqrstuvwxyzabcdefghijkl';
const CAPABILITY = `${CAPABILITY_ORIGIN}${CAPABILITY_SUFFIX}` as t.StringUrl;
const APPLICATION = 'http://127.0.0.1:51261' as t.StringUrl;
const stringIteratorPrototype = Object.getPrototypeOf('screen'[Symbol.iterator]());
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const segmentIteratorPrototype = Object.getPrototypeOf(
  segmenter.segment('screen')[Symbol.iterator](),
);

describe('@sys/driver-pi start:gui screen', () => {
  it('repaints one boot state at initial, transitioned, and resized viewport widths', () => {
    const state = createBootState();
    const harness = createScreenHarness({ width: 80, height: 24 });
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state,
      keyboard: true,
      onFailure() {},
    }, harness.deps);

    expect(harness.frames).to.have.length(1);
    expectFrame(harness.frames[0] ?? '', { width: 80, height: 24 }, 'preparing');

    state.set(Boot.startingAppHost);
    expect(harness.frames).to.have.length(2);
    expect(Cli.stripAnsi(harness.frames[1] ?? '')).to.contain('starting application host');

    state.set(Boot.ready(APPLICATION));
    expect(harness.frames).to.have.length(3);
    expect(Cli.stripAnsi(harness.frames[2] ?? '')).to.contain('ready');
    expect(Cli.stripAnsi(harness.frames[2] ?? '')).to.contain('127.0.0.1:51261');
    expect(harness.frames[2] ?? '').to.contain(CAPABILITY);

    harness.resize({ width: 48, height: 18 });
    expect(harness.frames).to.have.length(4);
    expectFrameBounds(harness.frames[3] ?? '', { width: 48, height: 18 });

    screen.dispose();
    screen.dispose();
    expect(harness.releases).to.eql(1);

    harness.resize({ width: 36, height: 12 });
    expect(harness.frames).to.have.length(4);
  });

  it('admits exact values returned by the real Cli.Screen size owner', () => {
    let frames = 0;
    let releases = 0;
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state: createBootState(),
      keyboard: true,
      onFailure() {},
    }, {
      isInteractive: () => true,
      size: Cli.Screen.size,
      observeResize: () => () => void (releases += 1),
      repaint: () => void (frames += 1),
    });

    expect({ kind: screen.kind, frames, releases }).to.eql({
      kind: 'acquired',
      frames: 1,
      releases: 0,
    });
    screen.dispose();
    screen.dispose();
    expect(releases).to.eql(1);
  });

  it('refuses inexact initial screen sizes without invoking accessors or Proxy traps', async () => {
    const residue = Symbol('screen-size-residue');
    const variants: readonly Readonly<{
      label: string;
      create: (counters: { traps: number }) => unknown;
    }>[] = [
      {
        label: 'accessor',
        create: (counters) => ({
          get width() {
            counters.traps += 1;
            throw new Error('screen width accessor invoked');
          },
          height: 24,
        }),
      },
      {
        label: 'proxy',
        create: (counters) =>
          new Proxy({ width: 80, height: 24 }, {
            get() {
              counters.traps += 1;
              throw new Error('screen size Proxy get invoked');
            },
            getOwnPropertyDescriptor() {
              counters.traps += 1;
              throw new Error('screen size Proxy descriptor invoked');
            },
            getPrototypeOf() {
              counters.traps += 1;
              throw new Error('screen size Proxy prototype invoked');
            },
            ownKeys() {
              counters.traps += 1;
              throw new Error('screen size Proxy keys invoked');
            },
          }),
      },
      {
        label: 'custom prototype',
        create: () => Object.assign(Object.create({}), { width: 80, height: 24 }),
      },
      {
        label: 'string residue',
        create: () => ({ width: 80, height: 24, extra: true }),
      },
      {
        label: 'symbol residue',
        create: () => ({ width: 80, height: 24, [residue]: true }),
      },
      {
        label: 'unbounded dimension',
        create: () => ({ width: 65_536, height: 24 }),
      },
      {
        label: 'fractional dimension',
        create: () => ({ width: 80, height: 23.5 }),
      },
    ];

    for (const variant of variants) {
      const counters = { traps: 0 };
      let releases = 0;
      let frames = 0;
      let failures = 0;
      const screen = StartGuiScreen.create({
        service: SERVICE,
        url: CAPABILITY,
        state: createBootState(),
        keyboard: true,
        onFailure() {
          failures += 1;
        },
      }, {
        isInteractive: () => true,
        size: () => variant.create(counters) as t.Cli.Screen.Size,
        observeResize: () => () => void (releases += 1),
        repaint: () => void (frames += 1),
      });
      const failure = await screen.failure.catch((cause) => cause);

      expect({
        label: variant.label,
        kind: screen.kind,
        traps: counters.traps,
        releases,
        frames,
        failures,
        message: (failure as Error).message,
      }).to.eql({
        label: variant.label,
        kind: 'failed',
        traps: 0,
        releases: 1,
        frames: 0,
        failures: 1,
        message: 'start:gui screen failed.',
      });
      screen.dispose();
      expect(releases).to.eql(1);
    }
  });

  it('refuses inexact resize events and sizes with one trap-free rollback', async () => {
    const variants: readonly Readonly<{
      label: string;
      create: (counters: { traps: number }) => unknown;
    }>[] = [
      {
        label: 'event accessor',
        create: (counters) => ({
          kind: 'size:changed',
          before: { width: 80, height: 24 },
          get after() {
            counters.traps += 1;
            throw new Error('resize after accessor invoked');
          },
        }),
      },
      {
        label: 'event proxy',
        create: (counters) =>
          new Proxy(
            {
              kind: 'size:changed',
              before: { width: 80, height: 24 },
              after: { width: 48, height: 18 },
            },
            {
              get() {
                counters.traps += 1;
                throw new Error('resize event Proxy get invoked');
              },
              getOwnPropertyDescriptor() {
                counters.traps += 1;
                throw new Error('resize event Proxy descriptor invoked');
              },
              getPrototypeOf() {
                counters.traps += 1;
                throw new Error('resize event Proxy prototype invoked');
              },
              ownKeys() {
                counters.traps += 1;
                throw new Error('resize event Proxy keys invoked');
              },
            },
          ),
      },
      {
        label: 'size accessor',
        create: (counters) => ({
          kind: 'size:changed',
          before: { width: 80, height: 24 },
          after: {
            get width() {
              counters.traps += 1;
              throw new Error('resize width accessor invoked');
            },
            height: 18,
          },
        }),
      },
      {
        label: 'size proxy',
        create: (counters) => ({
          kind: 'size:changed',
          before: { width: 80, height: 24 },
          after: new Proxy({ width: 48, height: 18 }, {
            get() {
              counters.traps += 1;
              throw new Error('resize size Proxy get invoked');
            },
            getOwnPropertyDescriptor() {
              counters.traps += 1;
              throw new Error('resize size Proxy descriptor invoked');
            },
            getPrototypeOf() {
              counters.traps += 1;
              throw new Error('resize size Proxy prototype invoked');
            },
            ownKeys() {
              counters.traps += 1;
              throw new Error('resize size Proxy keys invoked');
            },
          }),
        }),
      },
    ];

    for (const variant of variants) {
      const counters = { traps: 0 };
      let emit: ((event: unknown) => void) | undefined;
      let unsubscribes = 0;
      let eventDisposals = 0;
      let frames = 0;
      let failures = 0;
      const events = {
        resize$: {
          subscribe(handler: (event: unknown) => void) {
            emit = handler;
            return { unsubscribe: () => void (unsubscribes += 1) };
          },
        },
        dispose() {
          eventDisposals += 1;
        },
      };
      const screen = StartGuiScreen.create({
        service: SERVICE,
        url: CAPABILITY,
        state: createBootState(),
        keyboard: true,
        onFailure() {
          failures += 1;
        },
      }, {
        isInteractive: () => true,
        size: () => ({ width: 80, height: 24 }),
        observeResize: (handler) =>
          observeResizeWith(() => events as unknown as t.Cli.Screen.Events, handler),
        repaint: () => void (frames += 1),
      });
      expect(screen.kind).to.eql('acquired');
      emit?.(variant.create(counters));
      const failure = await screen.failure.catch((cause) => cause);

      expect({
        label: variant.label,
        traps: counters.traps,
        unsubscribes,
        eventDisposals,
        frames,
        failures,
        message: (failure as Error).message,
      }).to.eql({
        label: variant.label,
        traps: 0,
        unsubscribes: 1,
        eventDisposals: 1,
        frames: 1,
        failures: 1,
        message: 'start:gui screen failed.',
      });
      screen.dispose();
      expect({ unsubscribes, eventDisposals }).to.eql({ unsubscribes: 1, eventDisposals: 1 });
    }
  });

  it('repaints terminal links through captured URL authority after acquisition', () => {
    const NativeURL = URL;
    const state = createBootState();
    const harness = createScreenHarness({ width: 100, height: 18 });
    let failures = 0;
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
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
      state.set(Boot.ready(APPLICATION));
    }

    const frame = harness.frames.at(-1) ?? '';
    expect(ambientCalls).to.eql(0);
    expect(frame).to.contain(CAPABILITY);
    expect(frame).to.contain(APPLICATION);

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
        url: CAPABILITY,
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

  it('owns resize failure before mutated numeric presentation methods run', async () => {
    const cases: readonly Readonly<{ target: object; key: PropertyKey; label: string }>[] = [
      { target: Number, key: 'isFinite', label: 'Number.isFinite' },
      { target: Math, key: 'floor', label: 'Math.floor' },
      { target: Math, key: 'max', label: 'Math.max' },
    ];

    for (const fixture of cases) {
      const descriptor = Object.getOwnPropertyDescriptor(fixture.target, fixture.key);
      if (!descriptor) throw new Error(`Expected ${fixture.label} descriptor.`);
      const harness = createScreenHarness({ width: 100, height: 18 });
      let failures = 0;
      let observedFailures = 0;
      let observedFailure: unknown;
      const screen = StartGuiScreen.create({
        service: SERVICE,
        url: CAPABILITY,
        state: createBootState(),
        keyboard: true,
        onFailure() {
          failures += 1;
        },
      }, harness.deps);
      screen.failure.catch((cause) => {
        observedFailures += 1;
        observedFailure = cause;
      });
      let ambientCalls = 0;
      let escaped: unknown;

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
        try {
          harness.resize({ width: 48, height: 18 });
        } catch (cause) {
          escaped = cause;
        }
      }
      await Promise.resolve();

      expect({
        label: fixture.label,
        ambientCalls,
        escaped: escaped === undefined,
        failures,
        observedFailures,
        failureMessage: observedFailure instanceof Error ? observedFailure.message : undefined,
        frames: harness.frames.length,
        releases: harness.releases,
      }).to.eql({
        label: fixture.label,
        ambientCalls: 0,
        escaped: true,
        failures: 1,
        observedFailures: 1,
        failureMessage: 'start:gui screen failed.',
        frames: 1,
        releases: 1,
      });
      screen.dispose();
      expect(harness.releases).to.eql(1);
    }
  });

  it('projects sanitized failure evidence and a nonfatal opener warning', () => {
    const state = createBootState();
    const harness = createScreenHarness({ width: 100, height: 18 });
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state,
      keyboard: false,
      onFailure() {},
    }, harness.deps);

    state.set(Boot.failed(
      'source-unavailable',
      Object.freeze({
        kind: 'materialization',
        stage: 'manifest-fetch',
        reason: 'resource-failure',
        cleanup: 'pending',
      }),
    ));
    screen.warnOpen();
    screen.warnOpen();

    const frame = Cli.stripAnsi(harness.frames.at(-1) ?? '');
    expect(frame).to.contain('failed: source-unavailable');
    expect(frame).to.contain('manifest-fetch / resource-failure / cleanup:pending');
    expect(frame).to.contain('browser did not open; use launch URL');
    expect(frame).to.contain('/0123456789abcdef');
    expect(frame).to.not.contain('evi…nce');

    const rows = frame.split('\n');
    const row = (label: string) =>
      rows.find((candidate) => candidate.trimStart().startsWith(label)) ?? '';
    expect([
      row('service').indexOf(SERVICE),
      row('state').indexOf('failed: source-unavailable'),
      row('open').indexOf(CAPABILITY_ORIGIN),
      row('evidence').indexOf('manifest-fetch'),
      row('warning').indexOf('browser did not open'),
    ]).to.eql([14, 14, 14, 14, 14]);
    expect([
      rows.indexOf(row('service')),
      rows.indexOf(row('state')),
      rows.indexOf(row('evidence')),
      rows.indexOf(row('warning')),
      rows.indexOf(row('open')),
    ]).to.eql([3, 4, 5, 6, 7]);
    screen.dispose();
  });

  it('reports failed when synchronous measurement reentrantly fails resize ownership', async () => {
    let resize: ((size: t.Cli.Screen.Size) => void) | undefined;
    let releases = 0;
    const published: unknown[] = [];
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state: createBootState(),
      keyboard: true,
      onFailure: (cause) => published.push(cause),
    }, {
      isInteractive: () => true,
      observeResize(handler) {
        resize = handler;
        return () => void (releases += 1);
      },
      size() {
        resize?.({
          get width(): number {
            throw new Error('synchronous resize width failed');
          },
          height: 18,
        });
        return { width: 80, height: 24 };
      },
      repaint() {
        throw new Error('repaint must not run after synchronous resize failure');
      },
    });

    const failure = await screen.failure.catch((cause) => cause);
    expect(screen.kind).to.eql('failed');
    expect((failure as Error).message).to.eql('start:gui screen failed.');
    expect((published[0] as Error).message).to.eql('start:gui screen failed.');
    expect(releases).to.eql(1);
    screen.dispose();
    expect(releases).to.eql(1);
  });

  it('retains a resize observed during initial measurement', () => {
    const accepted = { width: 48, height: 18 };
    const harness = createScreenHarness(
      { width: 80, height: 24 },
      true,
      { resizeOnSize: accepted },
    );
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state: createBootState(),
      keyboard: true,
      onFailure() {},
    }, harness.deps);

    expect(harness.frames).to.have.length(1);
    expectFrame(harness.frames[0] ?? '', accepted, 'preparing');
    expect(Cli.stripAnsi(harness.frames[0] ?? '').split('\n')[1]).to.eql(
      '━'.repeat(accepted.width),
    );
    screen.dispose();
  });

  it('prioritizes state facts over controls in a short viewport', () => {
    const frame = (height: number) =>
      Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY,
        state: Boot.preparing,
        keyboard: true,
        openWarning: false,
        viewport: { width: 80, height },
      }));

    expect(frame(7)).to.contain('open');
    expect(frame(9)).to.not.contain('quit:');
    expect(frame(10)).to.contain('quit: ctrl + c or q');
  });

  it('omits packed keyboard controls when the complete footer cannot fit', () => {
    const frame = (width: number) =>
      Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY,
        state: Boot.preparing,
        keyboard: true,
        openWarning: false,
        viewport: { width, height: 10 },
      }));

    expect(frame(28)).to.not.contain('← + ctrl');
    expect(frame(28)).to.not.contain('quit:');
    expect(frame(29)).to.contain('← + ctrl');
    expect(frame(29)).to.contain('quit: ctrl + c or q');
  });

  it('dims subordinate labels to match the Cell service grammar', () => {
    const frame = StartGuiScreen.toString({
      service: SERVICE,
      url: CAPABILITY,
      state: Boot.preparing,
      keyboard: false,
      openWarning: false,
      viewport: { width: 80, height: 12 },
    });
    const rows = frame.split('\n');
    const row = (label: string) =>
      rows.find((candidate) => Cli.stripAnsi(candidate).trimStart().startsWith(label)) ?? '';

    expect(row('service')).to.contain(c.green('service'));
    expect(row('state')).to.contain(c.dim(c.gray(' state')));
    expect(row('open')).to.contain(c.dim(c.gray(' open')));
  });

  it('renders consistent modifier and key footer grammar', () => {
    const frame = StartGuiScreen.toString({
      service: SERVICE,
      url: CAPABILITY,
      state: Boot.preparing,
      keyboard: true,
      openWarning: false,
      viewport: { width: 80, height: 12 },
    });
    const footer = frame.split('\n').find((row) => Cli.stripAnsi(row).includes('quit:')) ?? '';

    expect(footer).to.contain(c.cyan('←'));
    expect(footer).to.contain(c.gray('+ ctrl'));
    expect(footer).to.contain(c.gray('quit: ctrl +'));
    expect(footer).to.contain(c.white('c'));
    const text = Cli.stripAnsi(footer);
    expect(text.startsWith('← + ctrl')).to.eql(true);
    expect(text.endsWith('quit: ctrl + c or q')).to.eql(true);
    expect(Cli.Fmt.Text.Width.measure(text)).to.eql(80);
  });

  it('fits a production capability by row and origin offsets while retaining its full link', () => {
    const openRow = (width: number) =>
      StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY,
        state: Boot.preparing,
        keyboard: false,
        openWarning: false,
        viewport: { width, height: 12 },
      }).split('\n').find((row) => Cli.stripAnsi(row).trimStart().startsWith('open')) ?? '';

    const exact = openRow(87);
    expect(Cli.stripAnsi(exact)).to.contain(CAPABILITY);
    expect(Cli.Fmt.Text.Width.measure(exact)).to.eql(85);

    const clippedSuffix = '/0123456789abcdefghijklm…pqrstuvwxyzabcdefghijkl';
    const clipped = openRow(86);
    expect(Cli.stripAnsi(clipped)).to.contain(`${CAPABILITY_ORIGIN}${clippedSuffix}`);
    expect(Cli.stripAnsi(clipped)).to.not.contain(CAPABILITY);
    expect(clipped).to.contain(c.gray(clippedSuffix));
    expect(clipped).to.contain(CAPABILITY);
    expect(Cli.Fmt.Text.Width.measure(clipped)).to.eql(84);
  });

  it('reserves the repaint cursor row at every viewport height', () => {
    for (const height of [1, 2, 6, 9, 10]) {
      const frame = StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY,
        state: Boot.preparing,
        keyboard: true,
        openWarning: false,
        viewport: { width: 80, height },
      });
      expectFrameBounds(frame, { width: 80, height });
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
        url: CAPABILITY,
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
      url: CAPABILITY,
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

  it('rolls back an event owner when resize subscription acquisition throws', async () => {
    const subscriptionFailure = new Error('resize subscription failed');
    let eventDisposals = 0;
    const createEvents = () =>
      ({
        resize$: {
          subscribe() {
            throw subscriptionFailure;
          },
        },
        dispose() {
          eventDisposals += 1;
        },
      }) as unknown as t.Cli.Screen.Events;
    const published: unknown[] = [];
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state: createBootState(),
      keyboard: true,
      onFailure: (cause) => published.push(cause),
    }, {
      isInteractive: () => true,
      size: () => ({ width: 80, height: 24 }),
      observeResize: (handler) => observeResizeWith(createEvents, handler),
      repaint() {},
    });

    const failure = await screen.failure.catch((cause) => cause);
    expect(failure).not.to.equal(subscriptionFailure);
    expect((failure as Error).message).to.eql('start:gui screen failed.');
    expect(published).to.have.length(1);
    expect(published[0]).not.to.equal(subscriptionFailure);
    expect((published[0] as Error).message).to.eql('start:gui screen resize acquisition failed.');
    expect(eventDisposals).to.eql(1);
    screen.dispose();
    expect(eventDisposals).to.eql(1);
  });

  it('returns retryable event-owner authority when subscription rollback fails', async () => {
    const subscriptionFailure = new Error('resize subscription failed');
    let eventDisposals = 0;
    const createEvents = () =>
      ({
        resize$: {
          subscribe() {
            throw subscriptionFailure;
          },
        },
        dispose() {
          eventDisposals += 1;
          if (eventDisposals < 3) throw new Error('event disposal failed');
        },
      }) as unknown as t.Cli.Screen.Events;
    const published: unknown[] = [];
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state: createBootState(),
      keyboard: true,
      onFailure: (cause) => published.push(cause),
    }, {
      isInteractive: () => true,
      size: () => ({ width: 80, height: 24 }),
      observeResize: (handler) => observeResizeWith(createEvents, handler),
      repaint() {},
    });

    const failure = await screen.failure.catch((cause) => cause);
    expect(failure).not.to.equal(subscriptionFailure);
    expect((failure as Error).message).to.eql('start:gui screen failed.');
    expect(published).to.have.length(1);
    expect(published[0]).not.to.equal(subscriptionFailure);
    expect((published[0] as Error).message).to.eql(
      'start:gui screen resize acquisition failed.',
    );
    expect(eventDisposals).to.eql(2);
    screen.dispose();
    expect(eventDisposals).to.eql(3);
    screen.dispose();
    expect(eventDisposals).to.eql(3);
  });

  it('rejects accessor and Proxy resize owners without invoking traps or leaking event ownership', () => {
    const variants: readonly ((counters: { traps: number; disposals: number }) => unknown)[] = [
      (counters) => ({
        get resize$() {
          counters.traps += 1;
          throw new Error('resize accessor invoked');
        },
        dispose() {
          counters.disposals += 1;
        },
      }),
      (counters) => ({
        resize$: {
          get subscribe() {
            counters.traps += 1;
            throw new Error('subscribe accessor invoked');
          },
        },
        dispose() {
          counters.disposals += 1;
        },
      }),
      (counters) => ({
        resize$: {
          subscribe() {
            return {
              get unsubscribe() {
                counters.traps += 1;
                throw new Error('unsubscribe accessor invoked');
              },
            };
          },
        },
        dispose() {
          counters.disposals += 1;
        },
      }),
      (counters) => ({
        resize$: {
          subscribe() {
            return new Proxy({}, {
              getOwnPropertyDescriptor() {
                counters.traps += 1;
                throw new Error('subscription Proxy trap invoked');
              },
              getPrototypeOf() {
                counters.traps += 1;
                throw new Error('subscription Proxy trap invoked');
              },
            });
          },
        },
        dispose() {
          counters.disposals += 1;
        },
      }),
    ];

    for (const variant of variants) {
      const counters = { traps: 0, disposals: 0 };
      let failure: unknown;
      try {
        observeResizeWith(
          () => variant(counters) as t.Cli.Screen.Events,
          () => undefined,
        );
      } catch (cause) {
        failure = cause;
      }
      expect({
        traps: counters.traps,
        disposals: counters.disposals,
        message: failure instanceof Error ? failure.message : undefined,
      }).to.eql({
        traps: 0,
        disposals: 1,
        message: 'start:gui screen resize acquisition failed.',
      });
    }
  });

  it('retains an event owner whose disposal authority is accessor-backed', async () => {
    let accessorCalls = 0;
    const events = {
      resize$: {
        subscribe() {
          return { unsubscribe() {} };
        },
      },
      get dispose() {
        accessorCalls += 1;
        throw new Error('dispose accessor invoked');
      },
    };
    const published: unknown[] = [];
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state: createBootState(),
      keyboard: true,
      onFailure: (cause) => published.push(cause),
    }, {
      isInteractive: () => true,
      size: () => ({ width: 80, height: 24 }),
      observeResize: (handler) =>
        observeResizeWith(() => events as unknown as t.Cli.Screen.Events, handler),
      repaint() {},
    });

    await screen.failure.catch(() => undefined);
    let cleanup: unknown;
    try {
      screen.dispose();
    } catch (cause) {
      cleanup = cause;
    }

    expect(screen.kind).to.eql('failed');
    expect(accessorCalls).to.eql(0);
    expect((published[0] as Error).message).to.eql(
      'start:gui screen resize acquisition failed.',
    );
    expect((cleanup as Error).message).to.eql('start:gui screen cleanup failed.');
  });

  it('uses acquisition-time event cleanup methods after returned owners mutate', () => {
    let acquiredUnsubscribe = 0;
    let acquiredDispose = 0;
    let replacementCalls = 0;
    const subscription = {
      unsubscribe() {
        acquiredUnsubscribe += 1;
      },
    };
    const events = {
      resize$: {
        subscribe() {
          return subscription;
        },
      },
      dispose() {
        acquiredDispose += 1;
      },
    };
    const release = observeResizeWith(
      () => events as unknown as t.Cli.Screen.Events,
      () => undefined,
    );

    subscription.unsubscribe = () => void (replacementCalls += 1);
    events.dispose = () => void (replacementCalls += 1);
    release();
    release();

    expect({ acquiredUnsubscribe, acquiredDispose, replacementCalls }).to.eql({
      acquiredUnsubscribe: 1,
      acquiredDispose: 1,
      replacementCalls: 0,
    });
  });

  it('disposes screen events even when resize unsubscription fails', () => {
    const unsubscribeFailure = new Error('unsubscribe failed');
    let eventDisposals = 0;
    const createEvents = () =>
      ({
        resize$: {
          subscribe: () => ({
            unsubscribe() {
              throw unsubscribeFailure;
            },
          }),
        },
        dispose() {
          eventDisposals += 1;
        },
      }) as unknown as t.Cli.Screen.Events;
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state: createBootState(),
      keyboard: true,
      onFailure() {},
    }, {
      isInteractive: () => true,
      size: () => ({ width: 80, height: 24 }),
      observeResize: (handler) => observeResizeWith(createEvents, handler),
      repaint() {},
    });
    let thrown: unknown;
    try {
      screen.dispose();
    } catch (cause) {
      thrown = cause;
    }

    expect(thrown).not.to.equal(unsubscribeFailure);
    expect((thrown as Error).message).to.eql('start:gui screen cleanup failed.');
    expect(eventDisposals).to.eql(1);
    try {
      screen.dispose();
    } catch (cause) {
      thrown = cause;
    }
    expect(thrown).not.to.equal(unsubscribeFailure);
    expect((thrown as Error).message).to.eql('start:gui screen cleanup failed.');
    expect(eventDisposals).to.eql(1);
  });

  it('publishes resize repaint failure and preserves retryable release failure', async () => {
    const repaintFailure = new Error('repaint failed');
    const releaseFailure = new Error('release failed');
    const harness = createScreenHarness(
      { width: 80, height: 24 },
      true,
      {
        releaseError: releaseFailure,
        repaint: (_frame, count) => {
          if (count === 2) throw repaintFailure;
        },
      },
    );
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
      state: createBootState(),
      keyboard: true,
      onFailure() {},
    }, harness.deps);
    const failure = screen.failure.catch((cause) => cause);

    harness.resize({ width: 48, height: 18 });

    const observed = await failure;
    expect(observed).not.to.equal(repaintFailure);
    expect((observed as Error).message).to.eql('start:gui screen failed.');
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
      url: CAPABILITY,
      state,
      keyboard: false,
      onFailure() {},
    }, harness.deps);

    const another = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY,
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
  if (width >= 87) expect(text).to.contain(CAPABILITY);
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
