import { c, Cli } from '@sys/cli';
import { HashFmt } from '@sys/crypto/fmt';
import { describe, expect, Fs, it, type t } from '../../-test.ts';
import { type Fixture, setup, teardown } from '../../-test/u.fixture.dist.ts';
import { DistServeScreen } from '../u.server.screen/mod.ts';
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
      expect(lines.at(-1)).to.include('open: o (browser)');
      expect(lines.at(-1)).to.include('quit: q');
    } finally {
      await teardown(fixture);
    }
  });

  it('prioritizes nested back and quit controls before the optional open hint', async () => {
    const fixture = await setup();
    try {
      const wide = text(nestedFrame(fixture, 120)).split('\n').at(-1) ?? '';
      expect(wide).to.include('← ctrl');
      expect(wide).to.include('open: o (browser)');
      expect(wide).to.include('quit: q');

      const compact = text(nestedFrame(fixture, 24)).split('\n').at(-1) ?? '';
      expect(compact).to.include('← ctrl');
      expect(compact).to.include('open: o');
      expect(compact).to.include('quit: q');
      expect(compact).to.not.include('(browser)');

      const constrained = text(nestedFrame(fixture, 23)).split('\n').at(-1) ?? '';
      expect(constrained).to.include('← ctrl');
      expect(constrained).to.include('quit: q');
      expect(constrained).to.not.include('open:');
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
      const awareness = c.magenta(c.bold('UNPINNED'));
      const logRow = /^\s+\d+ {2}(?:err|out) {2}/;
      const rows = raw.split('\n');
      const authorityRow = rows.find((line) => text(line).includes('authority'));
      const outputRow = rows.find((line) => text(line).includes('serving locally verified Dist'));
      const outputPayload = text(outputRow ?? '').replace(logRow, '');

      expect(authorityRow).to.include(c.white('authority'));
      expect(authorityRow).to.include(c.dim(c.gray('·')));
      expect(authorityRow).to.include(awareness);
      expect(outputPayload).to.not.eql('');
      expect(outputRow).to.include(c.gray('1'));
      expect(outputRow).to.include(c.gray('out'));
      expect(outputRow).to.include(c.white(outputPayload));
      expect(outputRow).to.not.include(awareness);
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
      expect(text(terminal.repaints[0] ?? '')).to.include('open: o (browser)');

      terminal.resize({ width: 25, height: 15 });
      expect(terminal.repaints).to.have.length(1);
      schedule.flush();
      const compact = text(terminal.repaints.at(-1) ?? '');
      expect(compact.split('\n').at(-1)).to.eql('open: o           quit: q');
      expect(compact).to.not.include('(browser)');

      const final = { width: 120, height: 24 };
      terminal.resize({ width: 120, height: 24 });
      terminal.resize({ width: 25, height: 15 });
      terminal.emit(final);
      final.width = 12;

      expect(schedule.calls).to.eql(2);
      expect(terminal.repaints).to.have.length(2);
      schedule.flush();
      expect(terminal.repaints).to.have.length(3);
      expect(text(terminal.repaints.at(-1) ?? '').split('\n')[1]).to.eql('━'.repeat(120));
      expect(text(terminal.repaints.at(-1) ?? '')).to.include('open: o (browser)');
      screen.dispose();
    } finally {
      await teardown(fixture);
    }
  });

  it('remeasures redraw and invalidates an older pending resize repaint', async () => {
    const fixture = await setup();
    try {
      const schedule = createScheduleHarness();
      const terminal = createTerminalHarness({
        viewport: { width: 80, height: 24 },
        onSize: (call) => {
          if (call === 2) schedule.flush();
        },
      });
      const screen = createReporter(fixture, terminal.deps, { schedule: schedule.schedule });

      terminal.resize({ width: 44, height: 18 });
      terminal.setViewport({ width: 96, height: 28 });
      screen.redraw();

      expect(terminal.sizeCalls).to.eql(2);
      expect(schedule.calls).to.eql(1);
      expect(schedule.cancelCalls).to.eql(0);
      expect(terminal.repaints).to.have.length(2);
      expect(text(terminal.repaints.at(-1) ?? '').split('\n')[1]).to.eql('━'.repeat(96));

      schedule.flush();
      expect(terminal.repaints).to.have.length(2);

      terminal.setViewport({ width: 72, height: 22 });
      screen.redraw();
      expect(terminal.sizeCalls).to.eql(3);
      expect(terminal.repaints).to.have.length(3);
      expect(text(terminal.repaints.at(-1) ?? '').split('\n')[1]).to.eql('━'.repeat(72));
      screen.dispose();
    } finally {
      await teardown(fixture);
    }
  });

  it('retains a newer resize observed during redraw measurement', async () => {
    const fixture = await setup();
    try {
      const terminal = createTerminalHarness({
        viewport: { width: 80, height: 24 },
        resizeOnSize: { width: 52, height: 18 },
        resizeOnSizeCall: 2,
      });
      const schedule = createScheduleHarness({ synchronous: true });
      const screen = createReporter(fixture, terminal.deps, { schedule: schedule.schedule });

      terminal.setViewport({ width: 100, height: 30 });
      screen.redraw();

      expect(terminal.sizeCalls).to.eql(2);
      expect(schedule.calls).to.eql(0);
      expect(terminal.repaints).to.have.length(2);
      expect(text(terminal.repaints.at(-1) ?? '').split('\n')[1]).to.eql('━'.repeat(52));
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
      canceledScreen.redraw();
      canceledSchedule.flush();
      canceled.resize({ width: 48, height: 18 });

      expect(canceledSchedule.calls).to.eql(1);
      expect(canceledSchedule.cancelCalls).to.eql(1);
      expect(canceled.sizeCalls).to.eql(1);
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

  it('routes redraw failure once through the screen failure channel', async () => {
    const fixture = await setup();
    try {
      const cause = new Error('redraw-failed');
      const terminal = createTerminalHarness({
        disposeError: new Error('cleanup-failed'),
        repaint: (_frame, count) => {
          if (count === 2) throw cause;
        },
      });
      const screen = createReporter(fixture, terminal.deps);
      const failure = screen.failure.catch((error) => error);

      screen.redraw();
      screen.redraw();

      expect(await failure).to.equal(cause);
      expect(terminal.sizeCalls).to.eql(2);
      expect(terminal.repaints).to.have.length(2);
      expect(terminal.disposeCalls).to.eql(1);
      screen.dispose();
      expect(terminal.disposeCalls).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('routes redraw cancellation failure through the screen failure channel', async () => {
    const fixture = await setup();
    try {
      const cause = new Error('redraw-cancel-failed');
      const terminal = createTerminalHarness();
      const schedule = createScheduleHarness({ cancelError: cause });
      const screen = createReporter(fixture, terminal.deps, { schedule: schedule.schedule });
      const failure = screen.failure.catch((error) => error);

      terminal.resize({ width: 44, height: 18 });
      screen.redraw();
      schedule.flush();

      expect(await failure).to.equal(cause);
      expect(schedule.cancelCalls).to.eql(1);
      expect(terminal.repaints).to.have.length(1);
      expect(terminal.disposeCalls).to.eql(1);
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

      screen.redraw();
      screen.dispose();
      screen.redraw();
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

  it('collapses and wholly links the digest against its remaining Dist-row width', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const manifestHref = Fs.Path.toFileUrl(Fs.Path.resolve('serve digest #1/dist.json'));
      const staticHref = new URL('./', manifestHref);
      const staticLink = Cli.Fmt.hyperlink('./dist/', staticHref);
      const outputRow = (width: number) => {
        const output = DistServeScreen.toString({
          identity: dist.pkg,
          origin: 'http://127.0.0.1:49152/' as t.StringUrl,
          dir: './dist' as t.StringDir,
          manifestHref,
          authority: { kind: 'local-unpinned', integrity: fixture.integrity },
          evidence: evidence(fixture),
          renderedAt: dist.build.time,
          viewport: { width, height: 30 },
          cursorRows: 1,
          keyboard: { enabled: false, print: true },
        });
        return output.split('\n').find((line) => text(line).includes('dist')) ?? '';
      };
      const suffix = `#${dist.hash.digest.slice(-5)}`;
      const full = outputRow(60);
      const algorithm = outputRow(44);
      const short = outputRow(37);

      expect(text(full)).to.include(`dist/ ← digest:sha256:${suffix}`);
      expect(full).to.include(staticLink);
      expect(full).to.include(
        Cli.Fmt.hyperlink(HashFmt.digest(dist.hash.digest, { maxWidth: 20 }), manifestHref),
      );
      expect(text(algorithm)).to.include(`dist/ ← sha256:${suffix}`);
      expect(algorithm).to.include(staticLink);
      expect(algorithm).to.include(
        Cli.Fmt.hyperlink(HashFmt.digest(dist.hash.digest, { maxWidth: 13 }), manifestHref),
      );
      expect(text(short)).to.include(`dist/ ← ${suffix}`);
      expect(short).to.include(staticLink);
      expect(short).to.include(
        Cli.Fmt.hyperlink(HashFmt.digest(dist.hash.digest, { maxWidth: 6 }), manifestHref),
      );
      expect(text(outputRow(31))).to.not.include('←');
    } finally {
      await teardown(fixture);
    }
  });

  it('links the static directory and digest to their separate targets', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const manifestHref = Fs.Path.toFileUrl(Fs.Path.resolve('serve digest #1/dist.json'));
      const staticHref = new URL('./', manifestHref);
      const staticLink = Cli.Fmt.hyperlink('./dist/', staticHref);
      const digest = HashFmt.digest(dist.hash.digest);
      const digestLink = Cli.Fmt.hyperlink(digest, manifestHref);
      const frame = DistServeScreen.toString({
        identity: dist.pkg,
        origin: 'http://127.0.0.1:49152/' as t.StringUrl,
        dir: './dist' as t.StringDir,
        manifestHref,
        authority: { kind: 'local-unpinned', integrity: fixture.integrity },
        evidence: evidence(fixture),
        renderedAt: dist.build.time,
        viewport: { width: 80, height: 30 },
        cursorRows: 1,
        keyboard: { enabled: false, print: true },
      });

      expect(staticHref.protocol).to.eql('file:');
      expect(staticHref.hash).to.eql('');
      expect(staticHref.href).to.include('serve%20digest%20%231/');
      expect(staticHref.href).to.not.eql(manifestHref.href);
      expect(frame).to.include(staticLink);
      expect(manifestHref.protocol).to.eql('file:');
      expect(manifestHref.hash).to.eql('');
      expect(manifestHref.href).to.include('serve%20digest%20%231/dist.json');
      expect(frame).to.include(`${c.green('←')} ${digestLink}`);
      expect(text(digestLink)).to.eql(`digest:sha256:#${dist.hash.digest.slice(-5)}`);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves Dist path context through monotonic suffix and column transitions', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const hash = dist.hash.digest;
      const manifestHref = Fs.Path.toFileUrl(Fs.Path.resolve('serve digest #1/dist.json'));
      const staticHref = new URL('./', manifestHref);
      const renderedAt = (dist.build.time + 17 * 60 * 60 * 1000) as t.UnixTimestamp;
      const digestLabels: string[] = [];
      let maxDigestWidth = Cli.Fmt.Text.Width.measure(HashFmt.digest(hash));
      while (maxDigestWidth > 0) {
        const digest = HashFmt.digest(hash, { maxWidth: maxDigestWidth });
        if (!digest) break;
        digestLabels.push(text(digest));
        maxDigestWidth = Cli.Fmt.Text.Width.measure(digest) - 1;
      }
      const digestRank = (label: string) => {
        const index = digestLabels.indexOf(label);
        return index < 0 ? 0 : digestLabels.length - index;
      };
      const rowAt = (
        width: number,
        dir: t.StringDir,
        metadata: 'complete' | 'no-age' | 'no-hash' = 'complete',
      ) => {
        const proof = evidence(fixture);
        const metadataDist = proof.dist as Partial<t.DeepMutable<typeof proof.dist>>;
        if (metadata === 'no-hash') delete metadataDist.hash;
        if (metadata === 'no-age') delete metadataDist.build;
        const output = DistServeScreen.toString({
          identity: dist.pkg,
          origin: 'http://127.0.0.1:49152/' as t.StringUrl,
          dir,
          manifestHref,
          authority: { kind: 'local-unpinned', integrity: fixture.integrity },
          evidence: proof,
          renderedAt,
          viewport: { width, height: 30 },
          cursorRows: 1,
          keyboard: { enabled: false, print: true },
        });
        return output.split('\n').find((line) => text(line).includes('static')) ?? '';
      };

      const dir = '/workspace/packages/sys-tools/src/cli-serve/server-screen/' as t.StringDir;
      const constrainedWidth = 60;
      const constrained = rowAt(constrainedWidth, dir);
      const directory = hyperlinkLabel(constrained, staticHref);
      const digest = hyperlinkLabel(constrained, manifestHref);
      const compactDigest = digestLabels.at(-1) ?? '';

      expect(text(constrained)).to.include(`← ${compactDigest} · 17h`);
      expect(directory).to.not.eql(undefined);
      expect(digest).to.not.eql(undefined);
      expect(text(directory ?? '').startsWith('/workspace/')).to.eql(true);
      expect(text(directory ?? '').endsWith('server-screen/')).to.eql(true);
      expect(text(directory ?? '')).to.include('…');
      expect(staticHref.href).to.not.eql(manifestHref.href);
      expect(Cli.Fmt.Text.Width.measure(constrained)).to.be.at.most(constrainedWidth);

      const transitions: number[] = [];
      for (let width = 140; width >= 24; width--) {
        const row = rowAt(width, dir);
        const linkedDirectory = hyperlinkLabel(row, staticHref);
        const linkedDigest = hyperlinkLabel(row, manifestHref);
        const rank = digestRank(text(linkedDigest ?? ''));

        if (transitions.at(-1) !== rank) transitions.push(rank);
        expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(width);
        expect(text(row)).to.include('17h');
        expect(linkedDirectory).to.not.eql(undefined);
      }
      expect(transitions).to.eql([3, 2, 1, 0]);

      const handoffDirs = [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43].map((length) =>
        'x'.repeat(length) as t.StringDir
      );
      handoffDirs.push(
        `/workspace/${'界面/'.repeat(14)}🧪/é/tail/` as t.StringDir,
      );
      for (const handoffDir of handoffDirs) {
        let previous: { digestRank: number; pathWidth: number } | undefined;
        for (let width = 79; width <= 85; width++) {
          const row = rowAt(width, handoffDir);
          const linkedDirectory = hyperlinkLabel(row, staticHref);
          const linkedDigest = hyperlinkLabel(row, manifestHref);
          const current = {
            digestRank: digestRank(text(linkedDigest ?? '')),
            pathWidth: Cli.Fmt.Text.Width.measure(linkedDirectory ?? ''),
          };

          expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(width);
          expect(linkedDirectory).to.not.eql(undefined);
          if (previous) {
            expect(current.digestRank).to.be.at.least(previous.digestRank);
            if (current.digestRank === previous.digestRank) {
              expect(current.pathWidth).to.be.at.least(previous.pathWidth);
            }
          }
          previous = current;
        }
      }

      const unicodeDir = `/workspace/界面/🧪/é/${'segment/'.repeat(8)}` as t.StringDir;
      const noHash = rowAt(40, unicodeDir, 'no-hash');
      const noAge = rowAt(40, unicodeDir, 'no-age');
      expect(text(noHash)).to.include('17h');
      expect(text(noHash)).to.not.include('←');
      expect(hyperlinkLabel(noHash, manifestHref)).to.eql(undefined);
      expect(text(noAge)).to.include(`← ${compactDigest}`);
      expect(text(noAge)).to.not.include('17h');
      expect(hyperlinkLabel(noAge, manifestHref)).to.not.eql(undefined);
      expect(Cli.Fmt.Text.Width.measure(noHash)).to.be.at.most(40);
      expect(Cli.Fmt.Text.Width.measure(noAge)).to.be.at.most(40);

      expect(text(rowAt(21, dir))).to.not.include('17h');
      expect(text(rowAt(21, dir))).to.not.include('←');
      expect(Cli.Fmt.Text.Width.measure(rowAt(21, dir))).to.be.at.most(21);
    } finally {
      await teardown(fixture);
    }
  });

  it('bounds every rendered row across compact-width transitions and tiny viewports', async () => {
    const fixture = await setup();
    try {
      const frame = (
        width: number,
        height = 30,
        origin: t.StringUrl = 'http://127.0.0.1:49152/' as t.StringUrl,
      ) =>
        DistServeScreen.toString({
          identity: fixture.cloneDist().pkg,
          origin,
          dir: fixture.source as t.StringDir,
          manifestHref: Fs.Path.toFileUrl(Fs.Path.join(fixture.source, 'dist.json')),
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
      const narrow = frame(
        40,
        30,
        'http://a-very-long-origin.example.test:49152/' as t.StringUrl,
      );
      expect(text(frame(79))).to.include(digestTail);
      expect(narrow).to.include(Cli.Fmt.omission());
      expect(narrow).to.include(c.bold(c.cyan('49152')));
      expect(text(frame(15))).to.not.include('open:');
      expect(text(frame(15))).to.not.include('quit:');
      expect(text(frame(120, 12))).to.not.include('open:');
    } finally {
      await teardown(fixture);
    }
  });
});

function nestedFrame(fixture: Fixture, width: number) {
  const dist = fixture.cloneDist();
  return DistServeScreen.toString({
    identity: dist.pkg,
    origin: 'http://127.0.0.1:49152/' as t.StringUrl,
    dir: fixture.source as t.StringDir,
    authority: { kind: 'pinned', integrity: fixture.integrity },
    evidence: evidence(fixture),
    renderedAt: dist.build.time,
    viewport: { width, height: 30 },
    cursorRows: 1,
    keyboard: { enabled: true, print: true, navigation: 'nested' },
  });
}

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

function hyperlinkLabel(input: string, url: URL) {
  const open = `\x1b]8;;${url.href}\x1b\\`;
  const close = '\x1b]8;;\x1b\\';
  const start = input.indexOf(open);
  if (start < 0) return undefined;
  const labelStart = start + open.length;
  const end = input.indexOf(close, labelStart);
  return end < 0 ? undefined : input.slice(labelStart, end);
}
