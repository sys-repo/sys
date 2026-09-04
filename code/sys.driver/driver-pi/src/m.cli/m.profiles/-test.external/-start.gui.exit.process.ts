import { expect, type t } from '../../../-test.ts';
import { exitCode } from '../../mod.ts';
import { startWith } from '../u.start/u.gui/mod.ts';
import type { Start } from '../u.start/u.gui/t.ts';
import { StartGuiPresentation } from '../u.start/u.gui/u.presentation.ts';
import {
  asProfileRoot,
  bootstrapStatusFixture,
  failedGenerationFixture,
  fakeGeneration,
  openedGenerationFixture,
  startedFixture,
} from '../-test/u.fixture.start.gui.ts';

type Scenario = 'source-q' | 'source-ctrl-c' | 'repair-q' | 'ready-q' | 'unowned';
type GuiScenario = Exclude<Scenario, 'unowned'>;
type CleanupEvent = 'app.close' | 'generation.release' | 'status.close';

const ROOT: t.StringDir = '/tmp/driver-pi.exit-process';
const SOURCE_UNAVAILABLE: t.Dist.Failed = Object.freeze({
  kind: 'failed',
  stage: 'manifest-fetch',
  reason: 'resource-failure',
  cleanup: 'not-needed',
});
const REPAIR_REQUIRED: t.Dist.Failed = Object.freeze({
  kind: 'failed',
  stage: 'existing-verification',
  reason: 'verification-failure',
  cleanup: 'not-needed',
  publication: 'occupied',
});
const FAILED_CLEANUP = ['status.close'] as const;
const READY_CLEANUP = ['app.close', 'generation.release', 'status.close'] as const;

const scenario = parseScenario(Deno.args[0]);
const cleanup: CleanupEvent[] = [];
const outcome = await run(scenario, cleanup);
if (scenario === 'unowned') throw new Error('unowned programmer failure unexpectedly resolved');
expect(cleanup).to.eql(cleanupOf(scenario));
const result: t.PiCliProfiles.Gui = {
  kind: 'gui',
  input: {},
  parsed: { _: [] },
  outcome: outcome === 'back' ? 'quit' : outcome,
};
const code = exitCode(result);
if (code !== 0) Deno.exitCode = code;

async function run(scenario: Scenario, cleanup: CleanupEvent[]) {
  const abort = new AbortController();
  let controls: Start.Gui.Presentation.Input | undefined;
  let state: Start.Gui.Presentation.State = Object.freeze({ kind: 'preparing' });
  const lost = new Promise<never>(() => undefined);
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
  const owner: Start.Gui.Presentation.Owner = Object.freeze({
    lost,
    get current() {
      return state;
    },
    starting() {
      state = Object.freeze({ kind: 'starting-app-host' });
    },
    ready(value) {
      state = Object.freeze({ kind: 'ready', ...value });
      console.info(`fixture ${scenario} ready`);
      queueMicrotask(() => controls?.onQuit());
    },
    failed(failure) {
      state = Object.freeze({
        kind: 'failed',
        category: failure.category,
        safeEvidence: failure.evidence,
      });
      console.info(`fixture ${scenario} failed:${failure.category}`);
      queueMicrotask(() => {
        if (scenario === 'source-ctrl-c') abort.abort('fixture ctrl-c');
        else controls?.onDismiss();
      });
    },
    warnOpen() {},
    redraw() {},
    shutdown: () => Promise.resolve(),
  });
  const presentation: Start.Gui.Dependencies['presentation'] = Object.freeze({
    ...StartGuiPresentation,
    prepare(input: Start.Gui.Presentation.Input) {
      controls = input;
      return Object.freeze({
        status: Object.freeze({
          pages: Object.freeze([]),
          resolve: () => Object.freeze({ kind: 'page', key: 'preparing' }),
        }),
        acquire: () => Promise.resolve(owner),
      });
    },
  });
  const materialization = scenario === 'unowned' ? undefined : materializationOf(scenario);
  const deps: Start.Gui.Dependencies = Object.freeze({
    runtimeRoot: () => ROOT,
    openGeneration(input) {
      if (!materialization) return Promise.reject(new Error('unowned programmer failure'));
      return Promise.resolve(
        materialization.kind === 'failed'
          ? failedGenerationFixture(materialization)
          : openedGenerationFixture(input, materialization, () => {
            cleanup.push('generation.release');
            return Promise.resolve();
          }),
      );
    },
    startStatus: () => Promise.resolve(status),
    startApplication: () => Promise.resolve(application),
    isHostError: (_): _ is t.DistServer.StartError => false,
    openBrowser() {},
    presentation,
  });

  return await startWith({ cwd: asProfileRoot(ROOT), until: abort.signal }, deps);
}

function cleanupOf(scenario: GuiScenario): readonly CleanupEvent[] {
  return scenario === 'ready-q' ? READY_CLEANUP : FAILED_CLEANUP;
}

function materializationOf(scenario: GuiScenario): t.Dist.Existing | t.Dist.Failed {
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
      throw new Error(`Unknown process scenario: ${String(input)}`);
  }
}
