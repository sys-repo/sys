import { describe, expect, it, Str } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { createHarness, keyEvent, readyBody, redrawKey } from './u.fixture.start-reporter.ts';

describe('@sys/cell/cli start reporter keyboard', () => {
  describe('binding and completion', () => {
    it('binds only the ready screen and keeps controls hidden', async () => {
      const readyFrame = Str.dedent(`
        header:80

          body:76
      `);
      const raw = createHarness('raw', { controls: true });
      raw.reporter.open();
      raw.reporter.ready(readyBody());
      expect(raw.effects).not.to.contain('keyboard:bind');
      await raw.reporter.dispose();

      const unavailable = createHarness('screen', { controls: true, keyboard: 'unavailable' });
      unavailable.reporter.open();
      unavailable.reporter.ready(readyBody());
      expect(unavailable.effects).to.contain('keyboard:bind');
      expect(unavailable.binding()?.quitKeys).to.eql('interrupt-only');
      expect(stripAnsi(unavailable.frames.at(-1) ?? '')).to.eql(readyFrame);
      await unavailable.reporter.dispose();
      expect(unavailable.effects).not.to.contain('keyboard:shutdown');

      const screen = createHarness('screen', { controls: true });
      screen.reporter.open();
      const openingFrames = screen.frames.length;
      screen.reporter.redraw();
      expect(screen.frames.length).to.eql(openingFrames);
      expect(screen.effects).not.to.contain('keyboard:bind');
      screen.reporter.ready(readyBody());

      expect(screen.effects).to.contain('keyboard:bind');
      expect(screen.binding()?.quitKeys).to.eql('interrupt-only');
      expect(stripAnsi(screen.frames.at(-1) ?? '')).to.eql(readyFrame);

      await screen.key(keyEvent('q'));
      expect(screen.effects).not.to.contain('keyboard:interrupt');
      await screen.interrupt();
      expect(screen.effects.filter((effect) => effect === 'keyboard:interrupt').length).to.eql(1);

      await screen.reporter.dispose();
      await screen.reporter.dispose();
      expect(screen.effects.filter((effect) => effect === 'keyboard:shutdown').length).to.eql(1);
      expect(screen.effects.filter((effect) => effect === 'keyboard:dispose').length).to.eql(0);
    });

    it('keyboard finishes → screen remains usable', async () => {
      const harness = createHarness('screen', { controls: true });
      harness.reporter.open();
      harness.reporter.ready(readyBody());
      harness.finishKeyboard();
      await Promise.resolve();

      expect(harness.effects).not.to.contain('keyboard:interrupt');
      expect(harness.failures).to.eql([]);
      const repaintCount = harness.frames.length;
      harness.setSize({ width: 48, height: 20 });
      harness.reporter.redraw();
      expect(harness.frames.length).to.eql(repaintCount + 1);
      expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('header:48');

      await harness.reporter.dispose();
      await harness.reporter.dispose();
      expect(harness.effects.filter((effect) => effect === 'keyboard:shutdown').length).to.eql(1);
      expect(harness.effects.filter((effect) => effect === 'keyboard:dispose').length).to.eql(0);
    });

    it('reports listener failure once, including during cleanup', async () => {
      const cause = new Error('keyboard-listener-failed');
      const harness = createHarness('screen', { controls: true });

      harness.reporter.open();
      harness.reporter.ready(readyBody());
      harness.failKeyboard(cause);
      await Promise.resolve();

      expect(harness.failures).to.eql([cause]);
      expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('body:76');
      await harness.reporter.dispose();
      expect(harness.failures).to.eql([cause]);
      expect(harness.effects.filter((effect) => effect === 'keyboard:shutdown').length).to.eql(1);
    });

    it('late listener failure → preserves an earlier shutdown outcome', async () => {
      const cause = new Error('late-keyboard-listener-failed');
      const harness = createHarness('screen', { controls: true, acceptFailure: false });

      harness.reporter.open();
      harness.reporter.ready(readyBody());
      harness.failKeyboard(cause);
      await Promise.resolve();
      harness.reporter.complete('summary');

      expect(harness.failures).to.eql([cause]);
      expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('summary');
      await harness.reporter.dispose();
    });

    it('enabling controls leaves wide, short, and empty frames unchanged', async () => {
      const cases = [
        {
          size: { width: 80, height: 24 },
          frame: Str.dedent(`
            header:80

              body:76
          `),
        },
        {
          size: { width: 20, height: 2 },
          frame: Str.dedent(`
            header:20
              body:16
          `),
        },
        { size: { width: 0, height: 0 }, frame: '' },
      ] as const;

      for (const item of cases) {
        const plain = createHarness('screen', { size: item.size });
        const controlled = createHarness('screen', { controls: true, size: item.size });
        plain.reporter.open();
        plain.reporter.ready(readyBody());
        controlled.reporter.open();
        controlled.reporter.ready(readyBody());

        expect(stripAnsi(plain.frames.at(-1) ?? '')).to.eql(item.frame);
        expect(controlled.frames.at(-1)).to.eql(plain.frames.at(-1));
        expect(stripAnsi(controlled.frames.at(-1) ?? '')).not.to.contain('redraw:');
        expect(stripAnsi(controlled.frames.at(-1) ?? '')).not.to.contain('quit:');

        await plain.reporter.dispose();
        await controlled.reporter.dispose();
      }
    });
  });

  describe('redraw', () => {
    it('accepts only unmodified lowercase r and remeasures the ready frame', async () => {
      const harness = createHarness('screen', { controls: true });
      const reporter = harness.reporter;
      reporter.open();
      reporter.ready(readyBody());
      const repaintCount = harness.frames.length;

      await harness.key(redrawKey({ shiftKey: true }));
      await harness.key(redrawKey({ ctrlKey: true }));
      await harness.key(redrawKey({ altKey: true }));
      await harness.key(redrawKey({ metaKey: true }));
      await harness.key(redrawKey({ key: 'R' }));
      await harness.key({ key: 'r' });
      expect(harness.frames.length).to.eql(repaintCount);

      harness.setSize({ width: 48, height: 20 });
      await harness.key(redrawKey());

      expect(harness.frames.length).to.eql(repaintCount + 1);
      const frame = stripAnsi(harness.frames.at(-1) ?? '');
      expect(frame).to.contain('header:48');
      expect(frame).to.contain('body:44');
      expect(frame).not.to.contain('redraw:');
      expect(frame).not.to.contain('quit:');

      harness.setSize({ width: 52, height: 20 });
      await harness.key(redrawKey());
      expect(harness.frames.length).to.eql(repaintCount + 2);
      expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('header:52');

      reporter.complete('summary');
      const completedFrames = harness.frames.length;
      await harness.key(redrawKey());
      expect(harness.frames.length).to.eql(completedFrames);

      await reporter.dispose();
    });

    it('preserves a newer resize observed during terminal measurement', async () => {
      let measurements = 0;
      const harness: ReturnType<typeof createHarness> = createHarness('screen', {
        controls: true,
        measure() {
          measurements += 1;
          if (measurements === 2) {
            harness.resize({ width: 42, height: 18 });
            return { width: 100, height: 40 };
          }
          return { width: 80, height: 24 };
        },
      });

      harness.reporter.open();
      harness.reporter.ready(readyBody());
      const repaintCount = harness.frames.length;
      await harness.key(redrawKey());

      expect(harness.frames.length).to.eql(repaintCount + 1);
      const frame = stripAnsi(harness.frames.at(-1) ?? '');
      expect(frame).to.contain('header:42');
      expect(frame).to.contain('body:38');
      expect(frame).not.to.contain('header:100');

      await harness.reporter.dispose();
    });

    it('repaints again when resize occurs during repaint, keeping the newest frame', async () => {
      let active = false;
      let resized = false;
      const harness: ReturnType<typeof createHarness> = createHarness('screen', {
        controls: true,
        onRepaint() {
          if (!active || resized) return;
          resized = true;
          harness.resize({ width: 42, height: 18 });
        },
      });

      harness.reporter.open();
      harness.reporter.ready(readyBody());
      const repaintCount = harness.frames.length;
      harness.setSize({ width: 100, height: 40 });
      active = true;
      await harness.key(redrawKey());
      active = false;

      expect(harness.frames.length).to.eql(repaintCount + 2);
      expect(stripAnsi(harness.frames.at(-2) ?? '')).to.contain('header:100');
      const finalFrame = stripAnsi(harness.frames.at(-1) ?? '');
      expect(finalFrame).to.contain('header:42');
      expect(finalFrame).to.contain('body:38');

      await harness.reporter.dispose();
    });

    it('reports repaint failure and ignores later resize and redraw requests', async () => {
      const cause = new Error('redraw-repaint-failed');
      const harness = createHarness('screen', { controls: true });

      harness.reporter.open();
      harness.reporter.ready(readyBody());
      const repaintCount = harness.frames.length;
      harness.setRepaintError(cause);
      await harness.key(redrawKey());

      expect(harness.failures).to.eql([cause]);
      expect(harness.frames.length).to.eql(repaintCount + 1);
      const settled = [...harness.effects];
      harness.resize({ width: 60, height: 20 });
      await harness.key(redrawKey());
      expect(harness.effects).to.eql(settled);

      await harness.reporter.dispose();
    });
  });
});
