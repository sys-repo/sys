import { c, Cli } from '@sys/cli';
import { HashFmt } from '@sys/crypto/fmt';
import { describe, expect, it, type t } from '../../-test.ts';
import { type Fixture, setup, teardown } from '../../-test/u.fixture.dist.ts';
import { DistServeScreen } from '../u.server/u.serve.screen.ts';
import {
  createReporter,
  createScheduleHarness,
  createTerminalHarness,
  evidence,
} from './u.fixture.serve.screen.ts';

describe('DistServeScreen', () => {
  it('freezes the presentation namespace', () => {
    expect(Object.isFrozen(DistServeScreen)).to.eql(true);
  });

  it('bottom-docks compact keyboard controls below a separate divider', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const raw = DistServeScreen.toString({
        identity: dist.pkg,
        origin: 'http://127.0.0.1:49152/' as t.StringUrl,
        dir: './dist' as t.StringDir,
        authority: { kind: 'pinned', integrity: fixture.integrity },
        evidence: evidence(fixture),
        renderedAt: dist.build.time,
        viewport: { width: 120, height: 30 },
        cursorRows: 1,
        keyboard: { enabled: true, print: true },
      });
      const output = text(raw);

      expect(output).to.include('@sample/foo');
      expect(output).to.include('http://localhost:49152/');
      expect(raw).to.include(Cli.Fmt.ServiceUrl.format(
        { href: 'http://localhost:49152/' as t.StringUrl },
        { origin: 'highlight' },
      ));
      expect(output).to.include('./dist/');
      expect(raw).to.include(c.green('static'));
      expect(raw).to.not.include(c.white('static'));
      expect(output).to.include(text(HashFmt.digest(dist.hash.digest)));
      expect(output).to.not.include(dist.hash.digest);
      expect(output).to.include(`pinned ${fixture.integrity}`);
      expect(raw).to.include(c.white('authority'));
      expect(raw).to.not.include(c.gray(`pinned ${fixture.integrity}`));
      expect(output).to.include('serving pinned Dist on HTTP server…');
      const lines = output.split('\n');
      const staticRow = lines.find((line) => line.includes('static')) ?? '';
      const authorityRow = lines.find((line) => line.includes('authority')) ?? '';
      expect(staticRow.indexOf('./dist/')).to.eql(authorityRow.indexOf('pinned'));
      expect(authorityRow.slice(
        authorityRow.indexOf('authority') + 'authority'.length,
        authorityRow.indexOf('pinned'),
      )).to.eql('  ');
      expect(lines.at(-2)).to.include('┄');
      expect(lines.at(-1)).to.include('open: o (in browser)');
      expect(lines.at(-1)).to.include('quit: ctrl + c or q');
    } finally {
      await teardown(fixture);
    }
  });

  it('renders compound package identity through the canonical header formatter', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      if (!dist.pkg) throw new Error('fixture package is required');
      const raw = DistServeScreen.toString({
        identity: { root: dist.pkg, subpath: '/ui//preview/' },
        origin: 'http://127.0.0.1:49152/' as t.StringUrl,
        dir: './dist' as t.StringDir,
        authority: { kind: 'local-unpinned', integrity: fixture.integrity },
        evidence: evidence(fixture),
        renderedAt: dist.build.time,
        viewport: { width: 120, height: 30 },
        cursorRows: 1,
        keyboard: { enabled: false, print: false },
      });

      expect(text(raw)).to.include('@sample/foo/ui/preview');
      expect(raw).to.include(c.bold(c.green('@sample/foo')));
      expect(raw).to.include(c.dim(c.green('/ui/preview')));
    } finally {
      await teardown(fixture);
    }
  });

  it('renders explicit local UNPINNED vocabulary and suppresses disabled keyboard rows', async () => {
    const fixture = await setup();
    try {
      const raw = localFrame(fixture);
      const output = text(raw);

      expect(output).to.include('local · UNPINNED');
      expect(output).to.include('serving locally verified Dist (UNPINNED) on HTTP server…');
      expect(output).to.not.include('open:');
      expect(output).to.not.include('quit:');
    } finally {
      await teardown(fixture);
    }
  });

  it('keeps local authority emphasis out of the white output payload', async () => {
    const fixture = await setup();
    try {
      const raw = localFrame(fixture);
      const warning = c.yellow(c.bold('UNPINNED'));
      const logRow = /^\s+\d+ {2}(?:err|out) {2}/;
      const rows = raw.split('\n');
      const authorityRow = rows.find((line) => text(line).includes('authority'));
      const outputRow = rows.find((line) => text(line).includes('serving locally verified Dist'));
      const outputPayload = text(outputRow ?? '').replace(logRow, '');

      expect(authorityRow).to.include(c.white('authority'));
      expect(authorityRow).to.include(c.dim(c.gray('·')));
      expect(authorityRow).to.include(warning);
      expect(outputPayload).to.not.eql('');
      expect(outputRow).to.include(c.gray('1'));
      expect(outputRow).to.include(c.gray('out'));
      expect(outputRow).to.include(c.white(outputPayload));
      expect(outputRow).to.not.include(warning);
    } finally {
      await teardown(fixture);
    }
  });

  it('subscribes before measurement, coalesces accepted resize, and disposes once', async () => {
    const fixture = await setup();
    try {
      const initial = { width: 80, height: 24 };
      const accepted = { width: 36, height: 15 };
      const terminal = createTerminalHarness({ viewport: initial, resizeOnSize: accepted });
      const schedule = createScheduleHarness();
      const until = new AbortController().signal;
      const screen = createReporter(fixture, terminal.deps, { until, schedule: schedule.schedule });

      expect(terminal.until).to.equal(until);
      expect(terminal.sizeCalls).to.eql(1);
      expect(text(terminal.repaints[0] ?? '').split('\n')[1]).to.eql(
        '━'.repeat(accepted.width),
      );

      const resized = { width: 44, height: 18 };
      terminal.resize(resized);
      expect(schedule.calls).to.eql(1);
      expect(terminal.repaints).to.have.length(1);
      schedule.flush();
      expect(terminal.repaints).to.have.length(2);
      expect(text(terminal.repaints.at(-1) ?? '').split('\n')[1]).to.eql(
        '━'.repeat(resized.width),
      );

      screen.dispose();
      screen.dispose();
      expect(terminal.disposeCalls).to.eql(1);
      expect(terminal.events.disposed).to.eql(true);

      terminal.resize(initial);
      expect(terminal.repaints).to.have.length(2);
    } finally {
      await teardown(fixture);
    }
  });

  it('repaints one copied final viewport from each resize burst', async () => {
    const fixture = await setup();
    try {
      const terminal = createTerminalHarness({ viewport: { width: 120, height: 24 } });
      const schedule = createScheduleHarness();
      const screen = createReporter(fixture, terminal.deps, {
        schedule: schedule.schedule,
        keyboard: { enabled: true, print: true },
      });
      expect(text(terminal.repaints[0] ?? '')).to.include('open: o (in browser)');

      terminal.resize({ width: 36, height: 15 });
      expect(terminal.repaints).to.have.length(1);
      schedule.flush();
      expect(text(terminal.repaints.at(-1) ?? '')).to.not.include('open:');

      const final = { width: 120, height: 24 };
      terminal.resize({ width: 120, height: 24 });
      terminal.resize({ width: 36, height: 15 });
      terminal.emit(final);
      final.width = 12;

      expect(schedule.calls).to.eql(2);
      expect(terminal.repaints).to.have.length(2);
      schedule.flush();
      expect(terminal.repaints).to.have.length(3);
      expect(text(terminal.repaints.at(-1) ?? '').split('\n')[1]).to.eql('━'.repeat(120));
      expect(text(terminal.repaints.at(-1) ?? '')).to.include('open: o (in browser)');
      screen.dispose();
    } finally {
      await teardown(fixture);
    }
  });

  it('allows synchronous schedules to repaint separate resize events', async () => {
    const fixture = await setup();
    try {
      const terminal = createTerminalHarness();
      const schedule = createScheduleHarness({ synchronous: true });
      const screen = createReporter(fixture, terminal.deps, { schedule: schedule.schedule });

      terminal.resize({ width: 44, height: 18 });
      terminal.resize({ width: 48, height: 18 });

      expect(schedule.calls).to.eql(2);
      expect(terminal.repaints).to.have.length(3);
      screen.dispose();
    } finally {
      await teardown(fixture);
    }
  });

  it('makes canceled and ended resize callbacks inert', async () => {
    const fixture = await setup();
    try {
      const canceled = createTerminalHarness();
      const canceledSchedule = createScheduleHarness();
      const canceledScreen = createReporter(fixture, canceled.deps, {
        schedule: canceledSchedule.schedule,
      });

      canceled.resize({ width: 44, height: 18 });
      canceledScreen.dispose();
      canceledSchedule.flush();
      canceled.resize({ width: 48, height: 18 });

      expect(canceledSchedule.calls).to.eql(1);
      expect(canceledSchedule.cancelCalls).to.eql(1);
      expect(canceled.repaints).to.have.length(1);
      expect(canceled.disposeCalls).to.eql(1);

      const ended = createTerminalHarness();
      const endedSchedule = createScheduleHarness();
      const endedScreen = createReporter(fixture, ended.deps, {
        schedule: endedSchedule.schedule,
      });
      ended.resize({ width: 44, height: 18 });
      ended.events.dispose();
      endedSchedule.flush();

      expect(ended.repaints).to.have.length(1);
      endedScreen.dispose();
    } finally {
      await teardown(fixture);
    }
  });

  it('routes schedule failure through the screen failure channel', async () => {
    const fixture = await setup();
    try {
      const cause = new Error('schedule-failed');
      const terminal = createTerminalHarness({ disposeError: new Error('cleanup-failed') });
      const schedule = createScheduleHarness({ error: cause });
      const screen = createReporter(fixture, terminal.deps, { schedule: schedule.schedule });
      const failure = screen.failure.catch((error) => error);

      terminal.resize({ width: 44, height: 18 });

      expect(await failure).to.equal(cause);
      expect(terminal.disposeCalls).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('attempts event cleanup when scheduled-task cancellation fails', async () => {
    const fixture = await setup();
    try {
      const cause = new Error('cancel-failed');
      const terminal = createTerminalHarness();
      const schedule = createScheduleHarness({ cancelError: cause });
      const screen = createReporter(fixture, terminal.deps, { schedule: schedule.schedule });
      terminal.resize({ width: 44, height: 18 });
      let thrown: unknown;

      try {
        screen.dispose();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.equal(cause);
      expect(terminal.unsubscribeCalls).to.eql(1);
      expect(terminal.events.disposed).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('stays inert when terminal observation is already disposed', async () => {
    const fixture = await setup();
    try {
      const terminal = createTerminalHarness({ disposed: true });
      const schedule = createScheduleHarness();
      const screen = createReporter(fixture, terminal.deps, { schedule: schedule.schedule });

      screen.dispose();
      expect(schedule.calls).to.eql(0);
      expect(terminal.sizeCalls).to.eql(0);
      expect(terminal.repaints).to.eql([]);
      expect(terminal.disposeCalls).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves initial and resize repaint failures over cleanup failures', async () => {
    const fixture = await setup();
    try {
      const initialCause = new Error('initial-repaint-failed');
      const initial = createTerminalHarness({
        disposeError: new Error('initial-cleanup-failed'),
        repaint: () => {
          throw initialCause;
        },
      });
      let initialThrown: unknown;
      try {
        createReporter(fixture, initial.deps);
      } catch (cause) {
        initialThrown = cause;
      }
      expect(initialThrown).to.equal(initialCause);
      expect(initial.disposeCalls).to.eql(1);

      const resizeCause = new Error('resize-repaint-failed');
      const resize = createTerminalHarness({
        disposeError: new Error('resize-cleanup-failed'),
        repaint: (_frame, count) => {
          if (count === 2) throw resizeCause;
        },
      });
      const schedule = createScheduleHarness();
      const screen = createReporter(fixture, resize.deps, { schedule: schedule.schedule });
      const failure = screen.failure.catch((cause) => cause);
      resize.resize({ width: 44, height: 18 });
      schedule.flush();

      expect(await failure).to.equal(resizeCause);
      expect(resize.disposeCalls).to.eql(1);
      screen.dispose();
      expect(resize.disposeCalls).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('collapses the digest against its remaining Dist-row width', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const outputRow = (width: number) => {
        const output = text(DistServeScreen.toString({
          identity: dist.pkg,
          origin: 'http://127.0.0.1:49152/' as t.StringUrl,
          dir: './dist' as t.StringDir,
          authority: { kind: 'local-unpinned', integrity: fixture.integrity },
          evidence: evidence(fixture),
          renderedAt: dist.build.time,
          viewport: { width, height: 30 },
          cursorRows: 1,
          keyboard: { enabled: false, print: true },
        }));
        return output.split('\n').find((line) => line.includes('dist')) ?? '';
      };
      const suffix = `#${dist.hash.digest.slice(-5)}`;

      expect(outputRow(60)).to.include(`dist/ ← digest:sha256:${suffix}`);
      expect(outputRow(44)).to.include(`dist/ ← sha256:${suffix}`);
      expect(outputRow(37)).to.include(`dist/ ← ${suffix}`);
      expect(outputRow(31)).to.not.include('←');
    } finally {
      await teardown(fixture);
    }
  });

  it('bounds every rendered row across compact-width transitions and tiny viewports', async () => {
    const fixture = await setup();
    try {
      const frame = (width: number, height = 30) =>
        DistServeScreen.toString({
          identity: fixture.cloneDist().pkg,
          origin: 'http://127.0.0.1:49152/' as t.StringUrl,
          dir: fixture.source as t.StringDir,
          authority: { kind: 'local-unpinned', integrity: fixture.integrity },
          evidence: evidence(fixture),
          renderedAt: fixture.cloneDist().build.time,
          viewport: { width, height },
          cursorRows: 1,
          keyboard: { enabled: true, print: true },
        });

      for (const width of [0, 1, 24, 79, 80, 81, 120]) {
        const output = frame(width, width < 24 ? 3 : 30);
        for (const line of output.split('\n')) {
          expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
        }
      }

      expect(frame(81)).to.eql(frame(81));
      const digestTail = `#${fixture.cloneDist().hash.digest.slice(-5)}`;
      expect(text(frame(79))).to.include(digestTail);
      expect(text(frame(24))).to.not.include('open:');
      expect(text(frame(120, 12))).to.not.include('open:');
    } finally {
      await teardown(fixture);
    }
  });
});

function localFrame(fixture: Fixture) {
  const dist = fixture.cloneDist();
  return DistServeScreen.toString({
    identity: dist.pkg,
    origin: 'http://127.0.0.1:49152/' as t.StringUrl,
    dir: fixture.source as t.StringDir,
    authority: { kind: 'local-unpinned', integrity: fixture.integrity },
    evidence: evidence(fixture),
    renderedAt: dist.build.time,
    viewport: { width: 120, height: 30 },
    cursorRows: 1,
    keyboard: { enabled: false, print: true },
  });
}

function text(input: string) {
  return Cli.stripAnsi(input);
}
