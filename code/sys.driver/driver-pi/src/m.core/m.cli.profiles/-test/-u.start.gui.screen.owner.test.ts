import { describe, expect, it } from '../../../-test.ts';
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
  it('repaints state transitions and resize events within the viewport', () => {
    const state = createBootState();
    const harness = createScreenHarness({ width: 80, height: 24 });
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state,
      keyboard: true,
      onFailure() {},
    }, harness.deps);

    expectFrame(harness.frames[0] ?? '', { width: 80, height: 24 }, 'preparing');
    state.set(Boot.startingAppHost);
    state.set(Boot.ready(APPLICATION.URL, DIST_DIGEST, GENERATION_HREF));
    expect(Cli.stripAnsi(harness.frames.at(-1) ?? '')).to.contain('ready');
    expect(harness.frames.at(-1) ?? '').to.contain(CAPABILITY.URL);

    harness.resize({ width: 48, height: 18 });
    expectFrameBounds(harness.frames.at(-1) ?? '', { width: 48, height: 18 });

    screen.dispose();
    screen.dispose();
    expect(harness.releases).to.eql(1);
    const frames = harness.frames.length;
    harness.resize({ width: 36, height: 12 });
    screen.redraw();
    expect(harness.frames).to.have.length(frames);
  });

  it('renders the development root and application links', () => {
    const state = createBootState();
    const harness = createScreenHarness({ width: 100, height: 18 });
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      root: DEVELOPMENT_ROOT,
      state,
      keyboard: true,
      onFailure() {},
    }, harness.deps);

    state.set(Boot.startingAppHost);
    state.set(Boot.ready(APPLICATION.URL, DIST_DIGEST, GENERATION_HREF));
    const frame = harness.frames.at(-1) ?? '';
    const text = Cli.stripAnsi(frame);
    expect(text).to.contain(CAPABILITY.DISPLAY);
    expect(text).to.contain(APPLICATION.DISPLAY);
    expect(frame).to.contain(CAPABILITY.URL);
    expect(frame).to.contain(APPLICATION.URL);
    expect(frame).to.contain(GENERATION_HREF);
    expect(frame).to.contain(Fs.Path.toFileUrl(DEVELOPMENT_ROOT).href);
    screen.dispose();
  });

  it('returns cleanup authority after an initial repaint failure', async () => {
    const harness = createScreenHarness(
      { width: 80, height: 24 },
      true,
      {
        repaint: () => {
          throw new Error('initial repaint failed');
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
    expect((failure as Error).message).to.eql('start:gui screen failed.');
    expect(harness.releases).to.eql(1);
    screen.dispose();
    expect(harness.releases).to.eql(1);
  });

  it('publishes redraw failure once and leaves the failed screen inert', async () => {
    const harness = createScreenHarness(
      { width: 80, height: 24 },
      true,
      {
        repaint: (_frame, count) => {
          if (count === 2) throw new Error('redraw repaint failed');
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

    expect(harness.frames).to.have.length(2);
    expect(harness.releases).to.eql(1);
    expect(published).to.have.length(1);
    expect((published[0] as Error).message).to.eql('start:gui screen failed.');
    expect((failure as Error).message).to.eql('start:gui screen failed.');
    screen.dispose();
  });

  it('returns explicit unavailability outside an interactive terminal', () => {
    const harness = createScreenHarness({ width: 80, height: 24 }, false);
    const state = createBootState();
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state,
      keyboard: false,
      onFailure() {},
    }, harness.deps);

    expect(screen.kind).to.eql('unavailable');
    state.set(Boot.startingAppHost);
    screen.redraw();
    screen.warnOpen();
    screen.dispose();
    expect(harness.frames).to.eql([]);
    expect(harness.releases).to.eql(0);
  });
});

function expectFrame(frame: string, viewport: t.Cli.Screen.Size, state: string) {
  const text = Cli.stripAnsi(frame);
  const rows = text.split('\n');
  const serviceRows = rows.filter((row) =>
    /^ {2}(service| state| open| app| evidence)\b/.test(row)
  );
  const footer = rows.find((row) => row.includes('quit:')) ?? '';

  expect(text).to.contain('@sys/driver-pi');
  expect(text).to.contain(SERVICE);
  expect(text).to.contain(state);
  expect(serviceRows).to.have.length(3);
  expect(footer.startsWith('← ctrl')).to.eql(true);
  expect(footer.endsWith('quit: q')).to.eql(true);
  expectFrameBounds(frame, viewport);
}

function expectFrameBounds(frame: string, viewport: t.Cli.Screen.Size) {
  const rows = Cli.stripAnsi(frame).split('\n');
  expect(rows.length).to.be.at.most(Math.max(0, viewport.height - 1));
  for (const row of rows) {
    expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(viewport.width);
  }
}
