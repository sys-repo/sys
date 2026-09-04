import { expect, type t } from '../../../-test.ts';
import { TaskCli } from '../../../../-scripts/task.cli.u.ts';
import { Cli } from '../common.ts';
import { start, type StartGuiDependencies } from '../u.start/u.gui/mod.ts';
import type { BootState } from '../u.start/u.state.ts';
import {
  asProfileRoot,
  bootstrapStatusFixture,
  deferred,
  failedGenerationFixture,
  fakeGeneration,
  openedGenerationFixture,
  startedFixture,
} from '../-test/u.fixture.start.gui.ts';

type Scenario = 'source-q' | 'source-ctrl-c' | 'repair-q' | 'ready-q' | 'unowned';
type GuiScenario = Exclude<Scenario, 'unowned'>;
type CleanupEvent = 'app.close' | 'generation.release' | 'status.close';

const ROOT = '/tmp/driver-pi.exit-process' as t.StringDir;
const SOURCE_UNAVAILABLE: t.Dist.MaterializeResult = Object.freeze({
  kind: 'failed',
  stage: 'manifest-fetch',
  reason: 'resource-failure',
  cleanup: 'not-needed',
});
const REPAIR_REQUIRED: t.Dist.MaterializeResult = Object.freeze({
  kind: 'failed',
  stage: 'existing-verification',
  reason: 'verification-failure',
  cleanup: 'not-needed',
  publication: 'occupied',
});
const Q_EVENT = { key: 'q', ctrlKey: false } as const;
const CTRL_C_EVENT = { key: 'c', ctrlKey: true } as const;
const FAILED_CLEANUP = ['status.close'] as const;
const READY_CLEANUP = ['app.close', 'generation.release', 'status.close'] as const;

const scenario = parseScenario(Deno.args[0]);
const cleanup: CleanupEvent[] = [];
const exitCode = await TaskCli.settle(() => run(scenario, cleanup));
if (scenario !== 'unowned') expect(cleanup).to.eql(cleanupOf(scenario));
if (exitCode !== 0) Deno.exitCode = exitCode;

async function run(scenario: Scenario, cleanup: CleanupEvent[]): Promise<void> {
  if (scenario === 'unowned') throw new Error('unowned programmer failure');

  const keyboardDone = deferred();
  const materialization = materializationOf(scenario);
  const status = bootstrapStatusFixture({
    close() {
      cleanup.push('status.close');
    },
  });
  const application = startedFixture({
    close() {
      cleanup.push('app.close');
      return Promise.resolve();
    },
  });
  let onQuit: (() => void | Promise<void>) | undefined;
  let terminalPrinted = false;
  const requestQuit = () => {
    if (!onQuit) throw new Error('Expected bound quit callback.');
    if (!Cli.Keyboard.Is.quit(quitEventOf(scenario))) {
      throw new Error('Expected canonical quit control.');
    }
    void onQuit();
  };

  const deps: StartGuiDependencies = {
    openGeneration: (input) =>
      Promise.resolve(
        materialization.kind === 'failed'
          ? failedGenerationFixture(materialization)
          : openedGenerationFixture(input, materialization, () => {
            cleanup.push('generation.release');
            return Promise.resolve();
          }),
      ),
    startStatus: () => Promise.resolve(status),
    start: () => Promise.resolve(application),
    open: () => undefined,
    bindKeyboard: (input) => {
      onQuit = input.onQuit;
      return {
        finished: keyboardDone.promise,
        dispose() {
          keyboardDone.resolve();
        },
      };
    },
    createScreen: (input) => {
      const settleFromState = (state: BootState) => {
        if (terminalPrinted || (state.kind !== 'failed' && state.kind !== 'ready')) return;
        terminalPrinted = true;
        const label = state.kind === 'ready' ? 'ready' : `failed:${state.category}`;
        console.info(`fixture ${scenario} ${label}`);
        queueMicrotask(requestQuit);
      };
      const release = input.state.subscribe(settleFromState);
      settleFromState(input.state.current);
      return {
        kind: 'acquired',
        failure: new Promise<never>(() => undefined),
        redraw() {},
        warnOpen() {},
        dispose: release,
      };
    },
  };

  const completion = await start({ cwd: asProfileRoot(ROOT), deps });
  expect(completion).to.eql({ kind: 'quit' });
}

function quitEventOf(scenario: GuiScenario): t.Cli.Keyboard.Is.QuitInput {
  return scenario === 'source-ctrl-c' ? CTRL_C_EVENT : Q_EVENT;
}

function cleanupOf(scenario: GuiScenario): readonly CleanupEvent[] {
  return scenario === 'ready-q' ? READY_CLEANUP : FAILED_CLEANUP;
}

function materializationOf(scenario: GuiScenario): t.Dist.MaterializeResult {
  switch (scenario) {
    case 'ready-q':
      return fakeGeneration();
    case 'repair-q':
      return REPAIR_REQUIRED;
    case 'source-q':
    case 'source-ctrl-c':
      return SOURCE_UNAVAILABLE;
  }
}

function parseScenario(input: unknown): Scenario {
  switch (input) {
    case 'source-q':
    case 'source-ctrl-c':
    case 'repair-q':
    case 'ready-q':
    case 'unowned':
      return input;
    default:
      throw new Error('Expected a start:gui exit-process scenario.');
  }
}
