import { Arr, expect, Is, Num, Path, Str } from './common.ts';
import type { t } from './common.ts';
import { FixtureDuration } from './fixtures/u.duration.ts';
import { FixtureMarker } from './fixtures/u.markers.ts';
import { type FixtureProcessResult, runFixtureProcess } from './u.fixture-process.ts';

const PACKAGE_DIR = Path.fromFileUrl(new URL('../../', import.meta.url));
const HarnessDuration = {
  startupTimeout: 30_000,
  executionTimeout: 15_000,
  drainTimeout: 5_000,
  timeoutControl: 100,
  timeoutMin: 100,
  timeoutMax: 30_000,
} as const satisfies Record<string, t.Msecs>;
const WRONG_REASON_MARKERS = [
  'Module not found',
  'No test modules found',
  'PermissionDenied',
  'NotCapable',
  'Requires read access',
  'Requires run access',
  'Requires net access',
  'Type checking failed',
  'unexpected argument',
] as const;

const Marker = {
  leaks: 'Leaks detected:',
  timer: 'A timer was started in this test, but never completed.',
  file: 'A file was opened during the test, but not closed during the test.',
  childResource: 'A child process was started during the test, but not closed during the test.',
  childOperation:
    'An async operation to wait for a subprocess to exit was started in this test, but never completed.',
  operationOnly:
    'An async operation to accept a TCP stream was started in this test, but never completed.',
  exit: 'Test case attempted to exit with exit code: 0',
  exitOptOut: 'exit sanitizer was disabled (sanitizeExit: false)',
  trace: 'The operation was started here:',
} as const;

type Scenario = {
  name: string;
  fixture: string;
  marker: string;
  flags?: string[];
  outcome: 'pass' | 'fail' | 'timeout';
  includes?: string[];
  excludes?: string[];
  timeout?: t.Msecs;
};

const timeoutScenario = {
  name: 'non-terminating child → reports timeout instead of sanitizer failure',
  fixture: 'fixture.timeout.ts',
  marker: FixtureMarker.timeout,
  outcome: 'timeout',
  timeout: HarnessDuration.timeoutControl,
} satisfies Scenario;

const scenarios: Scenario[] = [
  {
    name: 'clean lifecycle → exits zero under strict direct Deno policy',
    fixture: 'fixture.clean.ts',
    marker: FixtureMarker.clean,
    outcome: 'pass',
  },
  {
    name: 'strict direct Deno timer leak → fails with timer diagnostics',
    fixture: 'fixture.timer-strict.ts',
    marker: FixtureMarker.timerStrict,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.timer],
  },
  {
    name: 'strict direct Deno resource leak → fails with file diagnostics',
    fixture: 'fixture.resource-strict.ts',
    marker: FixtureMarker.resourceStrict,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.file],
  },
  {
    name: 'strict direct Deno child leak → fails for resource and operation signals',
    fixture: 'fixture.operation-strict.ts',
    marker: FixtureMarker.operationStrict,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.childResource, Marker.childOperation],
  },
  {
    name: 'default direct Deno exit interception → rejects exit zero',
    fixture: 'fixture.exit-default.ts',
    marker: FixtureMarker.exitDefault,
    outcome: 'fail',
    includes: [Marker.exit],
  },
  {
    name: 'explicit exit opt-out → exits zero with Deno warning',
    fixture: 'fixture.exit-opt-out.ts',
    marker: FixtureMarker.exitOptOut,
    outcome: 'pass',
    includes: [Marker.exitOptOut],
  },
  {
    name: 'strict operation-only control → fails before its opt-out is trusted',
    fixture: 'fixture.operation-only-strict.ts',
    marker: FixtureMarker.operationOnlyStrict,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.operationOnly],
  },
  {
    name: 'operation-only leak with operation opt-out → exits zero',
    fixture: 'fixture.operation-only-opt-out.ts',
    marker: FixtureMarker.operationOptOut,
    outcome: 'pass',
  },
  {
    name: 'resource leak with operation opt-out → still fails resource policy',
    fixture: 'fixture.resource-with-operation-opt-out.ts',
    marker: FixtureMarker.resourceWithOperationOptOut,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.file],
  },
  {
    name: 'resource-only leak with resource opt-out → exits zero',
    fixture: 'fixture.resource-only-opt-out.ts',
    marker: FixtureMarker.resourceOptOut,
    outcome: 'pass',
  },
  {
    name: 'operation leak with resource opt-out → still fails operation policy',
    fixture: 'fixture.operation-with-resource-opt-out.ts',
    marker: FixtureMarker.operationWithResourceOptOut,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.operationOnly],
  },
  {
    name: 'strict direct Deno leak with tracing → reports its origin',
    fixture: 'fixture.timer-strict.ts',
    marker: FixtureMarker.timerStrict,
    flags: ['--trace-leaks'],
    outcome: 'fail',
    includes: [Marker.leaks, Marker.timer, Marker.trace],
  },
  {
    name: 'explicitly unsanitized direct leak with tracing only → exits zero',
    fixture: 'fixture.explicit-unsanitized.ts',
    marker: FixtureMarker.explicitUnsanitized,
    flags: ['--trace-leaks'],
    outcome: 'pass',
  },
  {
    name: 'raw node-compatible leak under root sanitizer policy → exits zero',
    fixture: 'fixture.node-timer.ts',
    marker: FixtureMarker.nodeTimer,
    outcome: 'pass',
  },
  {
    name: 'bare direct Deno leak under root sanitizer policy → fails',
    fixture: 'fixture.timer-bare.ts',
    marker: FixtureMarker.timerBare,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.timer],
  },
  {
    name: 'clean facade lifecycle → exits zero under inherited root policy',
    fixture: 'fixture.facade-clean.ts',
    marker: FixtureMarker.facadeClean,
    outcome: 'pass',
  },
  {
    name: 'facade timer leak → fails with Deno timer diagnostics',
    fixture: 'fixture.facade-timer.ts',
    marker: FixtureMarker.facadeTimer,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.timer],
  },
  {
    name: 'facade resource leak → fails with Deno file diagnostics',
    fixture: 'fixture.facade-resource.ts',
    marker: FixtureMarker.facadeResource,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.file],
  },
  {
    name: 'facade child leak → fails for resource and operation signals',
    fixture: 'fixture.facade-operation.ts',
    marker: FixtureMarker.facadeOperation,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.childResource, Marker.childOperation],
  },
  {
    name: 'facade exit interception → rejects exit zero',
    fixture: 'fixture.facade-exit.ts',
    marker: FixtureMarker.facadeExit,
    outcome: 'fail',
    includes: [Marker.exit],
  },
  {
    name: 'facade operation opt-out → still fails resource policy',
    fixture: 'fixture.facade-operation-opt-out-resource.ts',
    marker: FixtureMarker.facadeOperationOptOutResource,
    outcome: 'fail',
    includes: [Marker.leaks, Marker.file],
    excludes: [Marker.operationOnly],
  },
  timeoutScenario,
];

Deno.test({
  name: 'Deno sanitizer alarm controls',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn(context) {
    await context.step('timeout control timing → preserves startup/execution separation', () => {
      expect(FixtureDuration.timeoutStartupDelay).to.be.greaterThan(timeoutScenario.timeout);
      expect(FixtureDuration.timeoutHold).to.be.greaterThan(timeoutScenario.timeout);
    });

    for (const scenario of scenarios) {
      await context.step(scenario.name, async () => {
        const result = await runFixture(scenario);
        const report = formatReport(scenario, result);

        if (result.captureError) throw new Error(report, { cause: result.captureError });
        if (result.timeout && scenario.outcome !== 'timeout') throw new Error(report);

        expect(result.markerReached, report).to.eql(true);
        expect(result.text, report).to.include(scenario.marker);
        WRONG_REASON_MARKERS.forEach((marker) =>
          expect(result.text, report).to.not.include(marker)
        );

        const required = Arr.uniq([scenario.marker, ...(scenario.includes ?? [])]);
        required.forEach((marker) => {
          expect(Is.string(marker), report).to.eql(true);
          expect(result.text, report).to.include(marker);
        });
        scenario.excludes?.forEach((marker) => {
          expect(Is.string(marker), report).to.eql(true);
          expect(result.text, report).to.not.include(marker);
        });

        if (scenario.outcome === 'timeout') {
          expect(result.timeout?.phase, report).to.eql('execution');
          expect(result.timeout?.killError, report).to.eql(undefined);
          expect(result.code, report).to.not.eql(0);
          expect(result.text, report).to.not.include(Marker.leaks);
        } else if (scenario.outcome === 'pass') {
          expect(result.code, report).to.eql(0);
          expect(result.text, report).to.not.include(Marker.leaks);
        } else {
          expect(result.code, report).to.not.eql(0);
        }
      });
    }
  },
});

/**
 * Helpers:
 */
async function runFixture(scenario: Scenario): Promise<FixtureProcessResult> {
  const executionTimeout = Num.clamp(
    HarnessDuration.timeoutMin,
    HarnessDuration.timeoutMax,
    scenario.timeout ?? HarnessDuration.executionTimeout,
  );
  const fixture = `./src/-test/fixtures/${scenario.fixture}`;
  // The test:process fixture check owns type safety; each isolated child proves runtime behavior only.
  return await runFixtureProcess({
    label: 'Sanitizer alarm child',
    args: [
      'test',
      '-P=test-process',
      '--no-prompt',
      '--no-check',
      ...(scenario.flags ?? []),
      fixture,
    ],
    cwd: PACKAGE_DIR,
    env: { FORCE_COLOR: '1' },
    marker: scenario.marker,
    startupTimeout: HarnessDuration.startupTimeout,
    executionTimeout,
    drainTimeout: HarnessDuration.drainTimeout,
  });
}

function formatReport(scenario: Scenario, result: FixtureProcessResult) {
  return Str.dedent(`
    Sanitizer alarm child did not match its contract.

    scenario: ${scenario.name}
    fixture: ${scenario.fixture}
    deno: ${Deno.version.deno}
    exit: ${result.code}
    signal: ${result.signal ?? 'none'}
    timeout: ${result.timeout?.phase ?? 'none'}
    elapsed: ${result.elapsed}ms
    kill-error: ${result.timeout?.killError?.message ?? 'none'}
    capture-error: ${result.captureError?.message ?? 'none'}

    ${result.text}
  `);
}
