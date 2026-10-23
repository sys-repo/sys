import { describe, expect, it } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { createHarness, readyBody, redrawKey } from './u.fixture.start-reporter.ts';

describe('@sys/cell/cli start reporter cleanup', () => {
  describe('acquisition failure', () => {
    it('releases terminal observation without masking the original failure', () => {
      const cause = new Error('repaint-failed');
      const harness = createHarness('screen', { repaintError: cause });
      let thrown: unknown;

      try {
        harness.reporter.open();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.equal(cause);
      expect(harness.effects).to.eql([
        'screen:observe',
        'repaint:header:80',
        'screen:release',
      ]);
    });

    it('retains acquisition and observer-release failures in order', () => {
      const cause = new Error('repaint-failed');
      const cleanup = new Error('screen-release-failed');
      const harness = createHarness('screen', {
        repaintError: cause,
        releaseError: cleanup,
      });
      let thrown: unknown;

      try {
        harness.reporter.open();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.be.instanceOf(AggregateError);
      const aggregate = thrown as AggregateError;
      expect(aggregate.cause).to.equal(cause);
      expect(aggregate.errors).to.eql([cause, cleanup]);
      expect(harness.effects).to.eql([
        'screen:observe',
        'repaint:header:80',
        'screen:release',
      ]);
    });
  });

  describe('disposal', () => {
    it('releases an active startup spinner and observer exactly once', async () => {
      const harness = createHarness('screen');
      const reporter = harness.reporter;

      reporter.open();
      reporter.starting(1);
      await reporter.dispose();
      await reporter.dispose();

      expect(harness.effects).to.eql([
        'screen:observe',
        'repaint:header:80',
        'spinner:create:stdout',
        'spinner:start:starting:1',
        'interval:start',
        'interval:cancel',
        'spinner:stop',
        'screen:release',
      ]);
    });

    it('deduplicates nested spinner and observer cleanup failures', async () => {
      const cancelFailure = new Error('interval-cancel-failed');
      const sharedFailure = new Error('spinner-and-screen-release-failed');
      const harness = createHarness('screen', {
        cancelError: cancelFailure,
        releaseError: sharedFailure,
        stopError: sharedFailure,
      });

      harness.reporter.open();
      harness.reporter.starting(1);
      const first = await harness.reporter.dispose().then(
        () => undefined,
        (cause) => cause,
      );
      const second = await harness.reporter.dispose().then(
        () => undefined,
        (cause) => cause,
      );

      expect(first).to.equal(second);
      expect(first).to.be.instanceOf(AggregateError);
      const aggregate = first as AggregateError;
      expect(aggregate.cause).to.equal(cancelFailure);
      expect(aggregate.errors).to.eql([cancelFailure, sharedFailure]);
      expect(harness.effects.filter((effect) => effect === 'interval:cancel').length).to.eql(1);
      expect(harness.effects.filter((effect) => effect === 'spinner:stop').length).to.eql(1);
      expect(harness.effects.filter((effect) => effect === 'screen:release').length).to.eql(1);
    });

    it('aggregates distinct screen and keyboard cleanup failures once', async () => {
      const screenFailure = new Error('screen-release-failed');
      const keyboardFailure = new Error('keyboard-shutdown-failed');
      const harness = createHarness('screen', {
        controls: true,
        releaseError: screenFailure,
        shutdownError: keyboardFailure,
      });
      harness.reporter.open();
      harness.reporter.ready(readyBody());

      const first = await harness.reporter.dispose().then(
        () => undefined,
        (cause) => cause,
      );
      const second = await harness.reporter.dispose().then(
        () => undefined,
        (cause) => cause,
      );

      expect(first).to.equal(second);
      expect(first).to.be.instanceOf(AggregateError);
      const aggregate = first as AggregateError;
      expect(aggregate.cause).to.equal(screenFailure);
      expect(aggregate.errors).to.eql([screenFailure, keyboardFailure]);
      expect(harness.effects.filter((effect) => effect === 'screen:release').length).to.eql(1);
      expect(harness.effects.filter((effect) => effect === 'keyboard:shutdown').length).to.eql(1);
    });

    it('ignores resize and phase effects after disposal', async () => {
      const harness = createHarness('screen');
      const reporter = harness.reporter;

      reporter.open();
      await reporter.dispose();
      const settled = [...harness.effects];

      harness.resize({ width: 40, height: 10 });
      reporter.redraw();
      reporter.starting(1);
      reporter.ready({ text: 'body', render: () => 'body' });
      reporter.complete('summary');

      expect(harness.effects).to.eql(settled);
    });
  });

  describe('completion after an earlier shutdown outcome', () => {
    it('raw → reports print failure without throwing it', async () => {
      const cause = new Error('completion-print-failed');
      const harness = createHarness('raw', { controls: true, acceptFailure: false });

      harness.reporter.open();
      harness.reporter.ready(readyBody());
      harness.setPrintError(cause);
      harness.reporter.complete('summary');

      expect(harness.failures).to.eql([cause]);
      expect(harness.effects.at(-2)).to.eql('print:\nsummary');
      await harness.reporter.dispose();
    });

    it('screen → reports repaint failure and ignores later redraw keys', async () => {
      const cause = new Error('completion-repaint-failed');
      const harness = createHarness('screen', { controls: true, acceptFailure: false });

      harness.reporter.open();
      harness.reporter.ready(readyBody());
      harness.setRepaintError(cause);
      harness.reporter.complete('summary');

      expect(harness.failures).to.eql([cause]);
      expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('summary');
      const settled = [...harness.effects];
      await harness.key(redrawKey());
      expect(harness.effects).to.eql(settled);

      await harness.reporter.dispose();
    });
  });
});
