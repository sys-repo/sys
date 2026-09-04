import { describe, expect, it } from '../../../-test.ts';
import { Cli, type t } from '../common.ts';
import { observeResizeWith, StartGuiScreen } from '../u.start/u.screen/mod.ts';
import { createBootState } from '../u.start/u.state.ts';
import { CAPABILITY, createScreenHarness, SERVICE } from './u.fixture.start.gui.screen.ts';

describe('@sys/driver-pi start:gui screen resize', () => {
  it('uses values returned by the real Cli.Screen size owner', () => {
    let frames = 0;
    let releases = 0;
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
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

  it('rejects invalid initial dimensions and releases resize observation', async () => {
    const variants = [
      { width: -1, height: 24 },
      { width: 80, height: 23.5 },
      { width: 65_536, height: 24 },
    ];

    for (const size of variants) {
      let releases = 0;
      const screen = StartGuiScreen.create({
        service: SERVICE,
        url: CAPABILITY.URL,
        state: createBootState(),
        keyboard: true,
        onFailure() {},
      }, {
        isInteractive: () => true,
        size: () => size,
        observeResize: () => () => void (releases += 1),
        repaint() {},
      });
      const failure = await screen.failure.catch((cause) => cause);

      expect(screen.kind).to.eql('failed');
      expect((failure as Error).message).to.eql('start:gui screen failed.');
      expect(releases).to.eql(1);
    }
  });

  it('repaints valid resize events and fails closed on invalid dimensions', async () => {
    const harness = createScreenHarness({ width: 80, height: 24 });
    let failures = 0;
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
      state: createBootState(),
      keyboard: true,
      onFailure() {
        failures += 1;
      },
    }, harness.deps);

    harness.resize({ width: 48, height: 18 });
    expect(harness.frames).to.have.length(2);
    expect(Cli.stripAnsi(harness.frames.at(-1) ?? '').split('\n').length).to.be.at.most(17);

    harness.resize({ width: -1, height: 18 });
    const failure = await screen.failure.catch((cause) => cause);
    expect(failures).to.eql(1);
    expect((failure as Error).message).to.eql('start:gui screen failed.');
    expect(harness.releases).to.eql(1);
  });

  it('subscribes, forwards post-resize size, then unsubscribes and disposes', () => {
    const events: string[] = [];
    let observer: ((event: t.Cli.Screen.SizeChanged) => void) | undefined;
    const createEvents = () =>
      ({
        resize$: {
          subscribe(next: (event: t.Cli.Screen.SizeChanged) => void) {
            observer = next;
            return { unsubscribe: () => events.push('unsubscribe') };
          },
        },
        dispose: () => events.push('dispose'),
      }) as unknown as ReturnType<typeof Cli.Screen.events>;
    const sizes: unknown[] = [];

    const release = observeResizeWith(createEvents, (size) => sizes.push(size));
    observer?.({
      kind: 'size:changed',
      before: { width: 80, height: 24 },
      after: { width: 48, height: 18 },
    });
    release();
    release();

    expect(sizes).to.eql([{ width: 48, height: 18 }]);
    expect(events).to.eql(['unsubscribe', 'dispose']);
  });

  it('disposes an event source when resize subscription acquisition fails', () => {
    let disposals = 0;
    const createEvents = () =>
      ({
        resize$: {
          subscribe() {
            throw new Error('subscribe failed');
          },
        },
        dispose: () => void (disposals += 1),
      }) as unknown as ReturnType<typeof Cli.Screen.events>;

    let failure: unknown;
    try {
      observeResizeWith(createEvents, () => {});
    } catch (cause) {
      failure = cause;
    }

    expect((failure as Error).message).to.eql('start:gui screen resize acquisition failed.');
    expect(disposals).to.eql(1);
  });
});
