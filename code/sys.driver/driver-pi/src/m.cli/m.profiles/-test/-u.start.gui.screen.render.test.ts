import { describe, expect, it, type t } from '../../../-test.ts';
import { Cli, Fs } from '../common.ts';
import type { Start } from '../u.start/u.gui/t.ts';
import { StartGuiPresentation } from '../u.start/u.gui/u.presentation.ts';
import { captureRootLink } from '../u.start/u.screen/u.render.serviceRow.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';
import { DIST_DIGEST, GENERATION_DIR } from './u.fixture.start.gui.ts';

const STATUS: t.StringUrl = 'http://127.0.0.1:45000/0123456789abcdefghijklmnopqrstuvwxyzabcd';
const APPLICATION: t.StringUrl = 'http://127.0.0.1:45001';
const READY: Start.Gui.Presentation.State = Object.freeze({
  kind: 'ready',
  origin: APPLICATION,
  digest: DIST_DIGEST,
  directoryHref: Fs.Path.toFileUrl(GENERATION_DIR).href,
});

function render(
  state: Start.Gui.Presentation.State,
  overrides: Partial<Start.Gui.Presentation.RenderInput> = {},
): string {
  return StartGuiPresentation.toString({
    service: START_GUI_SERVICE.name,
    url: STATUS,
    manifestUrl: START_GUI_SERVICE.source.manifestUrl,
    recovery: START_GUI_SERVICE.recovery,
    state,
    keyboard: true,
    openWarning: false,
    viewport: { width: 100, height: 18 },
    ...overrides,
  });
}

describe('@sys/driver-pi start:gui screen rendering', () => {
  it('projects every finite state and keeps back unavailable on failure', () => {
    const states: readonly [Start.Gui.Presentation.State, string][] = [
      [Object.freeze({ kind: 'preparing' }), 'preparing'],
      [Object.freeze({ kind: 'starting-app-host' }), 'starting application host'],
      [READY, 'ready'],
      [
        Object.freeze({
          kind: 'failed',
          category: 'local-failure',
          safeEvidence: Object.freeze({ kind: 'local', operation: 'application-host' }),
        }),
        'failed: local-failure',
      ],
      [Object.freeze({ kind: 'stopping' }), 'stopping'],
    ];

    for (const [state, expected] of states) {
      const frame = Cli.stripAnsi(render(state));
      expect(frame).to.contain(expected);
      expect(frame).to.contain('quit');
      expect(frame.includes('← ctrl'), state.kind).to.eql(
        state.kind !== 'failed' && state.kind !== 'stopping',
      );
    }
  });

  it('shows admitted application, Dist directory, digest, and capability links only when ready', () => {
    const preparing = render(Object.freeze({ kind: 'preparing' }));
    const ready = render(READY);
    const text = Cli.stripAnsi(ready);

    expect(Cli.stripAnsi(preparing)).not.to.contain('manifest');
    expect(text).to.contain(`digest:sha256:#${DIST_DIGEST.slice(-5)}`);
    expect(text).to.contain('http://localhost:45001');
    expect(ready).to.contain(`\x1b]8;;${STATUS}\x1b\\`);
    expect(ready).to.contain(`\x1b]8;;${START_GUI_SERVICE.source.manifestUrl}\x1b\\`);
    expect(ready).to.contain(`\x1b]8;;${Fs.Path.toFileUrl(GENERATION_DIR).href}\x1b\\`);
  });

  it('renders bounded materialization evidence, mismatch values, and exact recovery copy', () => {
    const expected = START_GUI_SERVICE.source.integrity;
    const received: t.StringHash = `sha256-${'b'.repeat(64)}`;
    const failed: Start.Gui.Presentation.State = Object.freeze({
      kind: 'failed',
      category: 'artifact-refused',
      safeEvidence: Object.freeze({
        kind: 'materialization',
        stage: 'manifest-fetch',
        reason: 'integrity-mismatch',
        cleanup: 'not-needed',
        manifestChecksum: Object.freeze({ expected, received }),
      }),
    });
    const exact = Cli.stripAnsi(render(failed));
    const forged = Cli.stripAnsi(render(failed, {
      recovery: Object.freeze({ ...START_GUI_SERVICE.recovery }),
    }));

    expect(exact).to.contain('manifest-fetch · integrity-mismatch · cleanup:not-needed');
    expect(exact).to.contain(expected);
    expect(exact).to.contain(received);
    expect(exact).to.contain(START_GUI_SERVICE.recovery.manifestChecksumMismatch);
    expect(forged).not.to.contain(START_GUI_SERVICE.recovery.manifestChecksumMismatch);
  });

  it('keeps source failures actionable and browser-open warnings nonfatal', () => {
    const failed: Start.Gui.Presentation.State = Object.freeze({
      kind: 'failed',
      category: 'source-unavailable',
      safeEvidence: Object.freeze({
        kind: 'materialization',
        stage: 'manifest-fetch',
        reason: 'resource-failure',
        cleanup: 'pending',
      }),
    });
    const frame = Cli.stripAnsi(render(failed, { openWarning: true }));

    expect(frame).to.contain('failed: source-unavailable');
    expect(frame).to.contain('manifest-fetch · resource-failure · cleanup:pending');
    expect(frame).to.contain('Check access to the configured source');
    expect(frame).to.contain('browser did not open; use launch URL');
    expect(frame).to.contain('http://localhost:45000');
    expect(render(failed, { openWarning: true })).to.contain(`\x1b]8;;${STATUS}\x1b\\`);
  });

  it('bounds every visible row and rejects malformed viewport authority', () => {
    for (const width of [1, 12, 22, 37, 80]) {
      const frame = render(READY, { viewport: { width, height: 8 } });
      for (const row of frame.split('\n')) {
        expect(Cli.Fmt.Text.Width.measure(row), `width:${width}`).to.be.at.most(width);
      }
      expect(frame.split('\n').length).to.be.at.most(7);
    }

    expect(() => render(READY, { viewport: { width: -1, height: 8 } })).to.throw();
    expect(() => render(READY, { viewport: { width: 80.5, height: 8 } })).to.throw();
  });

  it('admits only exact absolute development roots as file links', () => {
    const root = captureRootLink(GENERATION_DIR);
    expect(root?.text).to.eql(GENERATION_DIR);
    expect(root?.href).to.eql(Fs.Path.toFileUrl(GENERATION_DIR).href);
    expect(captureRootLink('relative')).to.eql(undefined);
    expect(captureRootLink(`${GENERATION_DIR}\nsecret`)).to.eql(undefined);
  });
});
