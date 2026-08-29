import { expect, type FsRooted, type t } from '../../../-test.ts';
import { TaskCli } from '../../../../-scripts/task.cli.u.ts';
import { Cli } from '../common.ts';
import { start, type StartGuiDependencies } from '../u.start/u.gui.ts';
import type { BootState } from '../u.start/u.state.ts';
import {
  asProfileRoot,
  bootstrapStatusFixture,
  deferred,
  fakeGeneration,
  startedFixture,
} from '../-test/u.fixture.start.gui.ts';

type Scenario = 'source-q' | 'source-ctrl-c' | 'repair-q' | 'ready-q' | 'unowned';
type GuiScenario = Exclude<Scenario, 'unowned'>;
type DirectoryTarget = FsRooted.Target<'directory'>;
type CleanupEvent = 'app.close' | 'lease.release' | 'status.close';

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
const FAILED_CLEANUP = ['lease.release', 'status.close'] as const;
const READY_CLEANUP = ['app.close', ...FAILED_CLEANUP] as const;

const scenario = parseScenario(Deno.args[0]);
const cleanup: CleanupEvent[] = [];
const exitCode = await TaskCli.settle(() => run(scenario, cleanup));
if (scenario !== 'unowned') expect(cleanup).to.eql(cleanupOf(scenario));
if (exitCode !== 0) Deno.exitCode = exitCode;

async function run(scenario: Scenario, cleanup: CleanupEvent[]): Promise<void> {
  if (scenario === 'unowned') throw new Error('unowned programmer failure');

  const keyboardDone = deferred();
  const target = Object.freeze({
    kind: 'directory' as const,
    path: '@sys.driver-pi' as t.StringRelativePath,
  }) as DirectoryTarget;
  const lease = Object.freeze({
    mode: 'shared' as const,
    targets: Object.freeze([target]),
    release: () => {
      cleanup.push('lease.release');
      return Promise.resolve();
    },
    [Symbol.asyncDispose]() {
      return this.release();
    },
  }) as FsRooted.Lease;
  const rooted = rootedFixture(target, lease);
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
    ensureDir: () => Promise.resolve(),
    createRooted: () => Promise.resolve(rooted),
    materialize: () => Promise.resolve(materialization),
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

function rootedFixture(target: DirectoryTarget, lease: FsRooted.Lease): FsRooted.Instance {
  return Object.freeze({
    path: `${ROOT}/.pi/@sys/dist`,
    admit: () => Promise.resolve(Object.freeze({ targets: Object.freeze([target]) })),
    acquireLease: () => Promise.resolve(Object.freeze({ kind: 'acquired', lease })),
  }) as unknown as FsRooted.Instance;
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
