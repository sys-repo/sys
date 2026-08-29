import { describe, expect, it } from '../../../-test.ts';
import { c, Cli, Fs, type t } from '../common.ts';
import { StartGuiScreen } from '../u.start/u.screen.ts';
import { Boot, type BootState, createBootState } from '../u.start/u.state.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';
import {
  APPLICATION,
  CAPABILITY,
  createScreenHarness,
  DEVELOPMENT_ROOT,
  SERVICE,
} from './u.fixture.start.gui.screen.ts';

describe('@sys/driver-pi start:gui screen rendering', () => {
  it('projects sanitized failure evidence and a nonfatal opener warning', () => {
    const state = createBootState();
    const harness = createScreenHarness({ width: 100, height: 18 });
    const screen = StartGuiScreen.create({
      service: SERVICE,
      url: CAPABILITY.URL,
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

    const rendered = harness.frames.at(-1) ?? '';
    const frame = Cli.stripAnsi(rendered);
    expect(frame).to.contain('failed: source-unavailable');
    expect(frame).to.contain('manifest-fetch · resource-failure · cleanup:pending');
    expect(frame).to.not.contain('deno task reset');
    expect(rendered).to.contain(c.yellow('browser did not open; use launch URL'));

    const rows = frame.split('\n');
    const row = (label: string) => rows.find((line) => line.trimStart().startsWith(label)) ?? '';
    expect(row('guidance')).to.contain('configured source, then launch a fresh session');
    expect([
      row('service').indexOf(SERVICE),
      row('state').indexOf('failed: source-unavailable'),
      row('open').indexOf(CAPABILITY.DISPLAY_ORIGIN),
      row('evidence').indexOf('manifest-fetch'),
      row('warning').indexOf('browser did not open'),
    ]).to.eql([14, 14, 14, 14, 14]);
    expect([
      rows.indexOf(row('service')),
      rows.indexOf(row('state')),
      rows.indexOf(row('evidence')),
      rows.indexOf(row('guidance')),
      rows.indexOf(row('warning')),
      rows.indexOf(row('open')),
    ]).to.eql([3, 4, 5, 6, 7, 8]);
    screen.dispose();
  });

  it('keeps one manifest orientation row after state in every lifecycle state', () => {
    const states: readonly (readonly [BootState, string])[] = [
      [Boot.preparing, 'preparing'],
      [Boot.startingAppHost, 'starting application host'],
      [Boot.ready(APPLICATION.URL), 'ready'],
      [Boot.failed('local-failure', { kind: 'local', operation: 'application-host' }), 'failed'],
      [Boot.stopping, 'stopping'],
    ];
    const digest = `digest:sha256:#${START_GUI_SERVICE.source.integrity.slice(-5)}`;

    for (const [state, stateText] of states) {
      const rows = Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY.URL,
        manifest: START_GUI_SERVICE.source.integrity,
        state,
        keyboard: false,
        openWarning: false,
        viewport: { width: 100, height: 18 },
      })).split('\n');
      const stateIndex = rows.findIndex((row) => row.trimStart().startsWith('state'));
      const manifestIndex = rows.findIndex((row) => row.trimStart().startsWith('manifest'));
      expect(rows[stateIndex]).to.contain(stateText);
      expect(rows[manifestIndex]).to.contain(digest);
      expect(manifestIndex).to.eql(stateIndex + 1);
    }
  });

  it('uses every shared compact digest reduction at its exact width boundary', () => {
    const tail = START_GUI_SERVICE.source.integrity.slice(-5);
    const cases = [
      [36, `digest:sha256:#${tail}`],
      [29, `sha256:#${tail}`],
      [22, `#${tail}`],
      [21, ''],
    ] as const;

    for (const [width, expected] of cases) {
      const rows = Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY.URL,
        manifest: START_GUI_SERVICE.source.integrity,
        state: Boot.preparing,
        keyboard: false,
        openWarning: false,
        viewport: { width, height: 12 },
      })).split('\n');
      const row = rows.find((candidate) => candidate.trimStart().startsWith('manifest')) ?? '';
      const value = row.trimStart().slice('manifest'.length).trim();
      expect(value, `width:${width}`).to.eql(expected);
    }
  });

  it('renders mismatch values and gates local recovery by exact policy identity', () => {
    const expected = START_GUI_SERVICE.source.integrity;
    const received: t.StringHash = `sha256-${'b'.repeat(64)}`;
    const mismatch = Boot.failed(
      'artifact-refused',
      Object.freeze({
        kind: 'materialization',
        stage: 'manifest-fetch',
        reason: 'integrity-mismatch',
        cleanup: 'not-needed',
        manifestChecksum: Object.freeze({ expected, received }),
      }),
    );
    const render = (
      width: number,
      state: BootState = mismatch,
      recovery: typeof START_GUI_SERVICE.recovery = START_GUI_SERVICE.recovery,
      height = 20,
    ) =>
      Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY.URL,
        manifest: expected,
        recovery,
        state,
        keyboard: false,
        openWarning: false,
        viewport: { width, height },
      }));
    const row = (frame: string, label: string) =>
      frame.split('\n').find((candidate) => candidate.trimStart().startsWith(label)) ?? '';

    const wide = render(120);
    const wideRows = wide.split('\n');
    expect(row(wide, 'evidence')).to.contain(
      'manifest-fetch · integrity-mismatch · cleanup:not-needed',
    );
    expect(row(wide, 'expected')).to.contain(expected);
    expect(row(wide, 'received')).to.contain(received);
    expect(row(wide, 'guidance')).to.contain(
      'Intended local build? In Driver Pi run deno task bind:gui:evidence:local, then relaunch.',
    );
    const evidenceIndex = wideRows.indexOf(row(wide, 'evidence'));
    expect([
      wideRows.indexOf(row(wide, 'expected')),
      wideRows.indexOf(row(wide, 'received')),
      wideRows.indexOf(row(wide, 'guidance')),
    ]).to.eql([evidenceIndex + 1, evidenceIndex + 2, evidenceIndex + 3]);

    const lookalike = Object.freeze({ ...START_GUI_SERVICE.recovery });
    expect(row(render(120, mismatch, lookalike), 'guidance')).to.eql('');

    const assetMismatch = Boot.failed(
      'artifact-refused',
      Object.freeze({
        kind: 'materialization',
        stage: 'resource-pull',
        reason: 'integrity-mismatch',
        cleanup: 'complete',
      }),
    );
    const asset = render(120, assetMismatch);
    expect([
      row(asset, 'expected'),
      row(asset, 'received'),
      row(asset, 'guidance'),
    ]).to.eql(['', '', '']);

    const narrow = render(58);
    for (const [label, value] of [['expected', expected], ['received', received]] as const) {
      const diagnostic = row(narrow, label);
      expect(diagnostic).to.contain('…');
      expect(diagnostic).not.to.contain(value);
      expect(Cli.Fmt.Text.Width.measure(diagnostic)).to.be.at.most(56);
    }

    const shortRows = render(58, mismatch, START_GUI_SERVICE.recovery, 8).split('\n');
    expect(shortRows.length).to.be.at.most(7);
    for (const shortRow of shortRows) {
      expect(Cli.Fmt.Text.Width.measure(shortRow)).to.be.at.most(58);
    }
  });

  it('keeps malformed release configuration distinct from source guidance', () => {
    const frame = Cli.stripAnsi(StartGuiScreen.toString({
      service: SERVICE,
      url: CAPABILITY.URL,
      state: Boot.failed(
        'configuration-invalid',
        Object.freeze({ kind: 'configuration', reason: 'manifest-url' }),
      ),
      keyboard: false,
      openWarning: false,
      viewport: { width: 100, height: 14 },
    }));

    expect(frame).to.contain('failed: configuration-invalid');
    expect(frame).to.contain('configuration/manifest-url');
    expect(frame.split('\n').some((row) => row.trimStart().startsWith('manifest'))).to.eql(false);
    expect(frame).to.not.contain('Check access to the configured source');
  });

  it('wraps materialization evidence at whole-item boundaries', () => {
    const frame = Cli.stripAnsi(StartGuiScreen.toString({
      service: SERVICE,
      url: CAPABILITY.URL,
      state: Boot.failed(
        'repair-required',
        Object.freeze({
          kind: 'materialization',
          stage: 'existing-verification',
          reason: 'verification-failure',
          cleanup: 'not-needed',
          publication: 'occupied',
        }),
      ),
      keyboard: false,
      openWarning: false,
      viewport: { width: 80, height: 14 },
    }));
    const rows = frame.split('\n');
    const evidenceIndex = rows.findIndex((row) => row.trimStart().startsWith('evidence'));
    const evidenceRows = rows.slice(evidenceIndex, evidenceIndex + 2);

    expect(evidenceRows).to.eql([
      '   evidence   existing-verification · verification-failure',
      '              cleanup:not-needed · publication:occupied',
    ]);
    expect(evidenceRows.join('\n')).to.not.contain('…');
  });

  it('guides only an occupied refused cache through reset and a fresh launch', () => {
    const render = (state: BootState) =>
      Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY.URL,
        state,
        keyboard: false,
        openWarning: false,
        viewport: { width: 120, height: 14 },
      }));
    const occupied = render(Boot.failed(
      'repair-required',
      Object.freeze({
        kind: 'materialization',
        stage: 'existing-verification',
        reason: 'verification-failure',
        cleanup: 'not-needed',
        publication: 'occupied',
      }),
    ));
    const committed = render(Boot.failed(
      'artifact-refused',
      Object.freeze({
        kind: 'materialization',
        stage: 'existing-verification',
        reason: 'verification-failure',
        cleanup: 'not-needed',
        publication: 'committed',
      }),
    ));

    expect(occupied).to.contain(
      'The cache was refused and retained. Run deno task reset, then launch a fresh session.',
    );
    expect(committed).to.not.contain('Run deno task reset');
  });

  it('prioritizes state facts over controls in a short viewport', () => {
    const frame = (height: number) =>
      Cli.stripAnsi(StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY.URL,
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
        url: CAPABILITY.URL,
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
      url: CAPABILITY.URL,
      state: Boot.preparing,
      keyboard: false,
      openWarning: false,
      viewport: { width: 80, height: 12 },
    });
    const rows = frame.split('\n');
    const row = (label: string) =>
      rows.find((candidate) => Cli.stripAnsi(candidate).trimStart().startsWith(label)) ?? '';

    expect(row('service')).to.contain(c.green('service'));
    expect(row('service')).to.contain(c.white(SERVICE));
    expect(row('state')).to.contain(c.dim(c.gray(' state')));
    expect(row('open')).to.contain(c.dim(c.gray(' open')));
  });

  it('renders failed state yellow and all other states gray', () => {
    const failed = Boot.failed('repair-required', { kind: 'cancellation' });
    expect(renderStateRow(failed)).to.contain(c.yellow('failed: repair-required'));

    const clipped = renderStateRow(failed, 33);
    expect(clipped).to.contain(c.yellow('failed: '));
    expect(clipped).to.contain(Cli.Fmt.omission());
    expect(clipped).not.to.contain(c.yellow('…'));
    expect(clipped).to.contain(c.yellow('required'));

    const normalStates = [
      [Boot.preparing, 'preparing'],
      [Boot.startingAppHost, 'starting application host'],
      [Boot.ready(APPLICATION.URL), 'ready'],
      [Boot.stopping, 'stopping'],
    ] as const;
    for (const [state, text] of normalStates) {
      expect(renderStateRow(state)).to.contain(c.gray(text));
    }
  });

  it('renders consistent modifier and key footer grammar', () => {
    const frame = StartGuiScreen.toString({
      service: SERVICE,
      url: CAPABILITY.URL,
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

  it('formats and links the exact development root while retaining its full file authority', () => {
    const renderRoot = (width: number, root: t.StringAbsoluteDir = DEVELOPMENT_ROOT) =>
      StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY.URL,
        root,
        state: Boot.ready(APPLICATION.URL),
        keyboard: false,
        openWarning: false,
        viewport: { width, height: 14 },
      });
    const rootRow = (width: number, root: t.StringAbsoluteDir = DEVELOPMENT_ROOT) =>
      renderRoot(width, root).split('\n').find((row) =>
        Cli.stripAnsi(row).trimStart().startsWith('root')
      ) ?? '';
    const linkedRootRow = (width: number, root: t.StringAbsoluteDir = DEVELOPMENT_ROOT) => {
      const href = Fs.Path.toFileUrl(root).href;
      return renderRoot(width, root).split('\n').find((row) => row.includes(href)) ?? '';
    };

    const href = Fs.Path.toFileUrl(DEVELOPMENT_ROOT).href;
    const exact = rootRow(120);
    expect(Cli.stripAnsi(exact)).to.contain(DEVELOPMENT_ROOT);
    expect(exact).to.contain(Cli.Fmt.Path.str(DEVELOPMENT_ROOT));
    expect(exact).to.contain(Cli.Fmt.hyperlink(Cli.Fmt.Path.str(DEVELOPMENT_ROOT), new URL(href)));

    const clipped = rootRow(58);
    expect(Cli.stripAnsi(clipped)).to.contain('…');
    expect(Cli.stripAnsi(clipped)).to.not.contain(DEVELOPMENT_ROOT);
    expect(clipped).to.contain(Cli.Fmt.omission());
    expect(clipped).to.contain(href);
    expect(Cli.Fmt.Text.Width.measure(clipped)).to.eql(56);

    for (const width of [24, 16, 8, 5]) {
      const narrow = linkedRootRow(width);
      expect(narrow).not.to.eql('');
      expect(narrow).to.contain(href);
      expect(Cli.Fmt.Text.Width.measure(narrow)).to.be.at.most(width);
      expect(Cli.stripAnsi(narrow)).not.to.contain('\u001b');
    }
    for (const width of [4, 1]) {
      const frame = renderRoot(width);
      expect(frame).not.to.contain(href);
      for (const row of frame.split('\n')) {
        expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(width);
      }
    }

    const unicodeRoot = '/tmp/café/東京/🚀/e\u0301' as t.StringAbsoluteDir;
    const unicode = rootRow(120, unicodeRoot);
    expect(Cli.stripAnsi(unicode)).to.contain(unicodeRoot);
    expect(unicode).to.contain(Fs.Path.toFileUrl(unicodeRoot).href);

    const unsafeRoots = [
      '/tmp/unsafe\u001b]8;;https://example.test',
      '/tmp/display-mismatch ',
      '/tmp/unpaired-high-\ud800',
      '/tmp/unpaired-low-\udc00',
      '/tmp/reversed-\u202etxt',
      '/tmp/zero-width-\u200bname',
      '/tmp/line-separator-\u2028name',
    ] as const;
    for (const root of unsafeRoots) {
      expect(rootRow(120, root as t.StringAbsoluteDir)).to.eql('');
    }
  });

  it('fits a production capability by row and origin offsets while retaining its full link', () => {
    const openRow = (width: number) =>
      StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY.URL,
        state: Boot.preparing,
        keyboard: false,
        openWarning: false,
        viewport: { width, height: 12 },
      }).split('\n').find((row) => Cli.stripAnsi(row).trimStart().startsWith('open')) ?? '';

    const exact = openRow(87);
    expect(Cli.stripAnsi(exact)).to.contain(CAPABILITY.DISPLAY);
    expect(Cli.Fmt.Text.Width.measure(exact)).to.eql(85);

    const clippedHead = '/0123456789abcdefghijklm';
    const clippedTail = 'pqrstuvwxyzabcdefghijkl';
    const clippedSuffix = `${clippedHead}…${clippedTail}`;
    const clipped = openRow(86);
    expect(Cli.stripAnsi(clipped)).to.contain(`${CAPABILITY.DISPLAY_ORIGIN}${clippedSuffix}`);
    expect(Cli.stripAnsi(clipped)).to.not.contain(CAPABILITY.DISPLAY);
    expect(clipped).to.contain(c.gray(clippedHead));
    expect(clipped).to.contain(Cli.Fmt.omission());
    expect(clipped).to.contain(c.gray(clippedTail));
    expect(clipped).to.contain(CAPABILITY.URL);
    expect(Cli.Fmt.Text.Width.measure(clipped)).to.eql(84);
  });

  it('reserves the repaint cursor row at every viewport height', () => {
    for (const height of [1, 2, 6, 9, 10]) {
      const frame = StartGuiScreen.toString({
        service: SERVICE,
        url: CAPABILITY.URL,
        state: Boot.preparing,
        keyboard: true,
        openWarning: false,
        viewport: { width: 80, height },
      });
      expectFrameBounds(frame, { width: 80, height });
    }
  });
});

/**
 * Helpers:
 */
type ScreenSize = t.Cli.Screen.Size;

function renderStateRow(state: BootState, width = 80): string {
  const frame = StartGuiScreen.toString({
    service: SERVICE,
    url: CAPABILITY.URL,
    state,
    keyboard: false,
    openWarning: false,
    viewport: { width, height: 12 },
  });
  return frame.split('\n').find(isStateRow) ?? '';
}

function isStateRow(row: string): boolean {
  return Cli.stripAnsi(row).trimStart().startsWith('state');
}

function expectFrameBounds(frame: string, viewport: ScreenSize) {
  const text = Cli.stripAnsi(frame);
  const rows = text ? text.split('\n') : [];
  expect(rows.length).to.be.at.most(Math.max(0, viewport.height - 1));
  for (const row of rows) {
    expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(viewport.width);
  }
}
