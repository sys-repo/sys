import { describe, expect, it } from '../../../-test.ts';
import { c, Cli, Fs, Path, type t } from '../common.ts';
import { StartGuiScreen } from '../u.start/u.screen.ts';
import { createScreenHarness } from './u.fixture.start.gui.screen.ts';

const SERVICE = 'sys.ui:pi';
const ORIGIN = 'http://127.0.0.1:51260' as t.StringUrl;
const SAMPLE_ROOT =
  '/test/fixtures/fake-workspace/.pi/@sys/dist/@sys.driver-pi/sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' as t.StringDir;

describe('@sys/driver-pi start:gui screen', () => {
  it('repaints the service frame at initial and resized viewport widths', () => {
    const harness = createScreenHarness({ width: 80, height: 24 });
    const screen = StartGuiScreen.create({
      service: SERVICE,
      dir: SAMPLE_ROOT,
      origin: ORIGIN,
      keyboard: true,
    }, harness.deps);

    expect(harness.frames).to.have.length(1);
    expectFrame(harness.frames[0] ?? '', { width: 80, height: 24 });

    harness.resize({ width: 48, height: 18 });
    expect(harness.frames).to.have.length(2);
    expectFrame(harness.frames[1] ?? '', { width: 48, height: 18 });
    expect(Cli.stripAnsi(harness.frames[1] ?? '')).to.contain('9abcdef');

    harness.resize({ width: 8, height: 2 });
    expect(harness.frames).to.have.length(3);
    expectFrameBounds(harness.frames[2] ?? '', { width: 8, height: 2 });

    screen.dispose();
    screen.dispose();
    expect(harness.releases).to.eql(1);

    harness.resize({ width: 36, height: 12 });
    expect(harness.frames).to.have.length(3);
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
      dir: SAMPLE_ROOT,
      origin: ORIGIN,
      keyboard: true,
    }, harness.deps);

    expect(harness.frames).to.have.length(1);
    expectFrame(harness.frames[0] ?? '', accepted);
    expect(Cli.stripAnsi(harness.frames[0] ?? '').split('\n')[1]).to.eql(
      '━'.repeat(accepted.width),
    );
    screen.dispose();
  });

  it('prioritizes service facts over controls in a short viewport', () => {
    const frame = (height: number) =>
      Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        dir: SAMPLE_ROOT,
        origin: ORIGIN,
        keyboard: true,
        viewport: { width: 80, height },
      }));

    expect(frame(8)).to.contain('root');
    expect(frame(9)).to.not.contain('quit:');
    expect(frame(10)).to.contain('quit: ctrl + c or q');
  });

  it('omits packed keyboard controls when the complete footer cannot fit', () => {
    const frame = (width: number) =>
      Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        dir: SAMPLE_ROOT,
        origin: ORIGIN,
        keyboard: true,
        viewport: { width, height: 10 },
      }));

    expect(frame(26)).to.not.contain('← back');
    expect(frame(26)).to.not.contain('quit:');
    expect(frame(27)).to.contain('← back');
    expect(frame(27)).to.contain('quit: ctrl + c or q');
  });

  it('dims subordinate labels to match the Cell service grammar', () => {
    const frame = StartGuiScreen.toString({
      service: SERVICE,
      dir: SAMPLE_ROOT,
      origin: ORIGIN,
      keyboard: false,
      viewport: { width: 80, height: 12 },
    });
    const rows = frame.split('\n');
    const row = (label: string) =>
      rows.find((candidate) => Cli.stripAnsi(candidate).trimStart().startsWith(label)) ?? '';

    expect(row('service')).to.contain(c.green('service'));
    expect(row('url')).to.contain(c.dim(c.gray(' url')));
    expect(row('root')).to.contain(c.dim(c.gray(' root')));
  });

  it('links the fitted root display to the complete folder file URL', () => {
    const frame = StartGuiScreen.toString({
      service: SERVICE,
      dir: SAMPLE_ROOT,
      origin: ORIGIN,
      keyboard: false,
      viewport: { width: 240, height: 12 },
    });
    const display = Cli.Fmt.Path.str(Fs.trimCwd(SAMPLE_ROOT, { prefix: true }), {
      highlightBasename: false,
    });
    const link = Cli.Fmt.hyperlink(c.underline(display), Path.toFileUrl(SAMPLE_ROOT));

    expect(frame).to.contain(link);
  });

  it('reserves the repaint cursor row at every viewport height', () => {
    for (const height of [1, 2, 6, 9, 10]) {
      const frame = StartGuiScreen.toString({
        service: SERVICE,
        dir: SAMPLE_ROOT,
        origin: ORIGIN,
        keyboard: true,
        viewport: { width: 80, height },
      });
      expectFrameBounds(frame, { width: 80, height });
    }
  });

  it('releases observation without masking initial repaint failure', () => {
    const repaintFailure = new Error('initial repaint failed');
    const harness = createScreenHarness(
      { width: 80, height: 24 },
      true,
      {
        releaseError: new Error('release failed'),
        repaint: () => {
          throw repaintFailure;
        },
      },
    );
    let thrown: unknown;

    try {
      StartGuiScreen.create({
        service: SERVICE,
        dir: SAMPLE_ROOT,
        origin: ORIGIN,
        keyboard: true,
      }, harness.deps);
    } catch (cause) {
      thrown = cause;
    }

    expect(thrown).to.equal(repaintFailure);
    expect(harness.releases).to.eql(1);
  });

  it('disposes screen events even when resize unsubscription fails', () => {
    const screenApi = Cli.Screen as { events: typeof Cli.Screen.events };
    const previousEvents = screenApi.events;
    const unsubscribeFailure = new Error('unsubscribe failed');
    let eventDisposals = 0;

    try {
      screenApi.events = () =>
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
        dir: SAMPLE_ROOT,
        origin: ORIGIN,
        keyboard: true,
      }, {
        isInteractive: () => true,
        size: () => ({ width: 80, height: 24 }),
        repaint() {},
      });
      let thrown: unknown;
      try {
        screen.dispose();
      } catch (cause) {
        thrown = cause;
      }

      expect(thrown).to.equal(unsubscribeFailure);
      expect(eventDisposals).to.eql(1);
      screen.dispose();
      expect(eventDisposals).to.eql(1);
    } finally {
      screenApi.events = previousEvents;
    }
  });

  it('publishes resize repaint failure and preserves it over release failure', async () => {
    const repaintFailure = new Error('repaint failed');
    const harness = createScreenHarness(
      { width: 80, height: 24 },
      true,
      {
        releaseError: new Error('release failed'),
        repaint: (_frame, count) => {
          if (count === 2) throw repaintFailure;
        },
      },
    );
    const screen = StartGuiScreen.create({
      service: SERVICE,
      dir: SAMPLE_ROOT,
      origin: ORIGIN,
      keyboard: true,
    }, harness.deps);
    const failure = screen.failure.catch((cause) => cause);

    harness.resize({ width: 48, height: 18 });

    expect(await failure).to.equal(repaintFailure);
    expect(harness.releases).to.eql(1);
    screen.dispose();
    expect(harness.releases).to.eql(1);
  });

  it('stays inert when terminal screen ownership is unavailable', () => {
    const harness = createScreenHarness({ width: 80, height: 24 }, false);
    const screen = StartGuiScreen.create({
      service: SERVICE,
      dir: SAMPLE_ROOT,
      origin: ORIGIN,
      keyboard: false,
    }, harness.deps);

    screen.dispose();
    expect(harness.frames).to.eql([]);
    expect(harness.releases).to.eql(0);
  });
});

/**
 * Helpers:
 */
type ScreenSize = t.Cli.Screen.Size;

function expectFrame(frame: string, viewport: ScreenSize) {
  const width = viewport.width;
  const text = Cli.stripAnsi(frame);
  const rows = text.split('\n');
  const serviceRows = rows.filter((row) => /^ {2}(service| url| root)\b/.test(row));
  const back = rows.find((row) => row.includes('← back')) ?? '';
  const quit = rows.find((row) => row.includes('quit:')) ?? '';

  expect(text).to.contain('@sys/driver-pi');
  expect(text).to.contain('service');
  expect(text).to.contain(SERVICE);
  expect(text).to.contain('http://localhost:51260/');
  expect(frame).to.contain(Path.toFileUrl(SAMPLE_ROOT).href);
  expect(text).to.not.contain('start:gui');
  expect(serviceRows).to.have.length(3);
  for (const row of serviceRows) {
    expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(width - 2);
  }
  expect(back.startsWith('← back')).to.eql(true);
  expect(quit.endsWith('quit: ctrl + c or q')).to.eql(true);
  expect(Cli.Fmt.Text.Width.measure(quit)).to.eql(width);
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
