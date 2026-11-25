import { describe, expect, it, Str, stripAnsi, type t } from './common.ts';
import { resolveBrowserTargets } from '../u.lifecycle/u.browser.targets.ts';
import { startCellReady } from '../u.lifecycle/u.start.ts';
import { createHarness, keyEvent, readyBody, redrawKey } from './u.fixture.start-reporter.ts';

describe('@sys/cell/cli start reporter keyboard', () => {
  describe('binding and completion', () => {
    it('advertises quit only for a live ready binding', async () => {
      const readyFrame = Str.dedent(`
        header:80

          body:76
      `);
      const unavailable = createHarness('screen', { controls: true, keyboard: 'unavailable' });
      unavailable.reporter.open();
      unavailable.reporter.ready(readyBody());
      expect(unavailable.effects).to.contain('keyboard:bind');
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
      const frame = stripAnsi(screen.frames.at(-1) ?? '');
      expect(frame).to.contain(readyFrame);
      expect(frame.trimEnd()).to.match(/quit: q$/);
      expect(frame).not.to.contain('open:');

      await screen.key(keyEvent('q'));
      expect(screen.effects).to.contain('keyboard:quit');
      expect(screen.effects).not.to.contain('keyboard:interrupt');

      await screen.reporter.dispose();
      await screen.reporter.dispose();
      expect(screen.effects.filter((effect) => effect === 'keyboard:shutdown')).to.have.length(1);
    });

    it('keyboard finishes → screen remains usable', async () => {
      const harness = createHarness('screen', { controls: true });
      harness.reporter.open();
      harness.reporter.ready(readyBody());
      harness.finishKeyboard();
      await Promise.resolve();

      expect(harness.effects).not.to.contain('keyboard:interrupt');
      expect(harness.failures).to.eql([]);
      expect(stripAnsi(harness.frames.at(-1) ?? '')).not.to.contain('quit:');
      const repaintCount = harness.frames.length;
      harness.setSize({ width: 48, height: 20 });
      harness.reporter.redraw();
      expect(harness.frames.length).to.eql(repaintCount + 1);
      expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('header:48');

      await harness.reporter.dispose();
      expect(harness.effects.filter((effect) => effect === 'keyboard:shutdown')).to.have.length(1);
    });

    it('reports listener failure once, including during cleanup', async () => {
      const cause = new Error('keyboard-listener-failed');
      const harness = createHarness('screen', { controls: true });

      harness.reporter.open();
      harness.reporter.ready(readyBody());
      const frame = () => stripAnsi(harness.frames.at(-1) ?? '');
      expect(frame()).to.contain('quit: q');
      harness.failKeyboard(cause);
      await Promise.resolve();

      expect(harness.failures).to.eql([cause]);
      expect(frame()).to.eql(Str.dedent(`
        header:80

          body:76
      `));
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
      expect(stripAnsi(harness.frames.at(-1) ?? '')).not.to.contain('quit:');
      harness.reporter.complete('summary');

      expect(harness.failures).to.eql([cause]);
      expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('summary');
      await harness.reporter.dispose();
    });

    it('does not displace protected service rows to show controls', async () => {
      const cases = [
        {
          size: { width: 20, height: 2 },
          frame: Str.dedent(`
            header:20
              body:16
          `),
        },
        { size: { width: 0, height: 0 }, frame: '' },
      ] as const;

      for (const { size, frame } of cases) {
        await using screen = createHarness('screen', { controls: true, size });
        screen.reporter.open();
        screen.reporter.ready(readyBody());
        expect(stripAnsi(screen.frames.at(-1)!)).to.eql(frame);
      }
    });
  });

  describe('browser requests', () => {
    const targets = ['a', 'b', 'c'].map((service) => ({
      service,
      pathname: '/',
      href: `https://${service}.test/?private`,
    }));
    const diagnostics = [{ service: 'view', pathname: '/absent', matches: 0 }];
    const input = { ...readyBody(), browser: { targets, diagnostics } };

    it('modified, uppercase, or incomplete key events → no open or quit', async () => {
      await using screen = createHarness('screen', { controls: true });
      screen.reporter.open();
      screen.reporter.ready(input);
      const effects = [...screen.effects];
      for (const key of ['o', 'q']) {
        for (const flag of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey']) {
          await screen.key(keyEvent(key, { [flag]: true }));
        }
        await screen.key(keyEvent(key.toUpperCase()));
        await screen.key({ key });
      }
      expect(screen.effects).to.eql(effects);
    });

    it('opens in order with hidden hints; failures survive resize until the next press', async () => {
      let fail = true;
      const harness = createHarness('screen', {
        controls: true,
        openBrowser(href) {
          if (href === targets[1].href && fail) throw new Error('private launcher failure');
        },
      });
      const frame = () => stripAnsi(harness.frames.at(-1) ?? '');
      const attempts = () => harness.effects.filter((effect) => effect.startsWith('open:'));
      const batch = targets.map(({ href }) => `open:${href}`);
      harness.reporter.open();
      harness.reporter.ready(input);
      expect(frame()).to.contain('view /absent: no matching HTTP(S) URL');
      expect(attempts()).to.eql([]);
      harness.resize({ width: 20, height: 10 });
      expect(frame().split('\n').at(-1)).to.match(/^open: o +quit: q$/);
      // With two spare rows, dock the rule immediately above the keys; with one, hide both.
      harness.resize({ width: 80, height: 5 });
      expect(frame().split('\n').at(-2)).to.eql('┄'.repeat(80));
      expect(frame().split('\n').at(-1)).to.match(/^open: o \(browser\) +quit: q$/);
      harness.resize({ width: 80, height: 4 });
      expect(frame()).to.eql(Str.dedent(`
        header:80
          body:76
          view /absent: no matching HTTP(S) URL
      `));
      await harness.key(keyEvent('o'));
      expect(attempts()).to.eql(batch);
      harness.resize({ width: 80, height: 24 });
      expect(frame()).to.contain('b /: open request failed');
      expect(frame()).not.to.contain('private');
      expect(frame()).to.contain('open: o (browser)');
      fail = false;
      await harness.key(keyEvent('o'));
      expect(attempts()).to.eql([...batch, ...batch]);
      expect(frame()).not.to.contain('open request failed');
      expect(frame()).to.contain('no matching HTTP(S) URL');
      harness.finishKeyboard();
      await Promise.resolve();
      expect(frame()).not.to.contain('open:');
      expect(frame()).not.to.contain('quit:');
      await harness.key(keyEvent('o'));
      expect(attempts()).to.eql([...batch, ...batch]);
      await harness.reporter.dispose();
    });

    it('completion retires browser and quit controls before releasing the keyboard', async () => {
      const harness = createHarness('screen', { controls: true });
      harness.reporter.open();
      harness.reporter.ready(input);
      harness.reporter.complete('summary');
      const effects = [...harness.effects];
      await harness.key(keyEvent('o'));
      await harness.key(keyEvent('q'));
      expect(harness.effects).to.eql(effects);
      const frame = stripAnsi(harness.frames.at(-1) ?? '');
      expect(frame).not.to.contain('open:');
      expect(frame).not.to.contain('quit:');
      await harness.reporter.dispose();
    });

    it('no targets or keyboard → show missing and ambiguous selectors', async () => {
      const ambiguous = { service: 'proxy', pathname: '/', matches: 2 };
      const missing = { targets: [], diagnostics: [...diagnostics, ambiguous] };
      const screen = createHarness('screen', { controls: true, keyboard: 'unavailable' });
      screen.reporter.open();
      screen.reporter.ready({ ...readyBody(), browser: missing });
      const frame = stripAnsi(screen.frames.at(-1) ?? '');
      expect(frame).to.contain('view /absent: no matching HTTP(S) URL');
      expect(frame).to.contain('proxy /: 2 matching HTTP(S) URLs');
      expect(frame).not.to.contain('open:');
      expect(frame).not.to.contain('quit:');
      await screen.reporter.dispose();
    });

    it('raw mode with browser declarations → unchanged bytes and no keyboard or opener', async () => {
      const urls = [{ href: 'https://preview.test/' }];
      const services: t.Cli.Fmt.Service.Input[] = [{ name: 'A', status: { state: 'ready', urls } }];
      const selection = resolveBrowserTargets([{ service: 'A', pathnames: '/', urls }]);
      const input = startCellReady(services, false, selection);
      const baseline = startCellReady(services, false);
      for (const terminal of [true, false]) {
        const raw = createHarness('raw', { controls: true, terminal, header: '' });
        raw.reporter.open();
        raw.reporter.ready(input);
        raw.reporter.complete('summary');
        await raw.reporter.dispose();
        const text = terminal ? baseline.render({ hyperlinks: true }) : baseline.text;
        expect(raw.effects).to.eql([`print:${text}`, 'print:\nsummary']);
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
