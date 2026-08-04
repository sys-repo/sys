import {
  Arr,
  describe,
  Err,
  expect,
  Is,
  it,
  Num,
  Obj,
  Path,
  Str,
  stripAnsi,
  Time,
} from './common.ts';
import type { t } from './common.ts';
import { FixtureDuration } from './fixtures/u.duration.ts';
import { FixtureMarker } from './fixtures/u.markers.ts';

const PACKAGE_DIR = Path.fromFileUrl(new URL('../../', import.meta.url));
const HarnessDuration = {
  startupTimeout: 30_000,
  executionTimeout: 15_000,
  drainTimeout: 5_000,
  timeoutControl: 500,
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
    name: 'raw node-compatible leak under CLI sanitizer flags → exits zero',
    fixture: 'fixture.node-timer.ts',
    marker: FixtureMarker.nodeTimer,
    flags: ['--sanitize-ops', '--sanitize-resources'],
    outcome: 'pass',
  },
  {
    name: 'bare direct Deno leak under CLI sanitizer flags → fails',
    fixture: 'fixture.timer-bare.ts',
    marker: FixtureMarker.timerBare,
    flags: ['--sanitize-ops', '--sanitize-resources'],
    outcome: 'fail',
    includes: [Marker.leaks, Marker.timer],
  },
  timeoutScenario,
];

describe(
  'Deno sanitizer alarm controls',
  { sanitizeOps: true, sanitizeResources: true },
  () => {
    it('timeout control timing → preserves startup/execution separation', () => {
      expect(FixtureDuration.timeoutStartupDelay).to.be.greaterThan(timeoutScenario.timeout);
      expect(FixtureDuration.timeoutHold).to.be.greaterThan(timeoutScenario.timeout);
    });

    scenarios.forEach((scenario) => {
      it(scenario.name, async () => {
        const result = await runFixture(scenario);
        const report = formatReport(scenario, result);

        if (result.captureError) throw new Error(report, { cause: result.captureError });
        if (result.timeout && scenario.outcome !== 'timeout') throw new Error(report);

        expect(result.text, report).to.include(scenario.marker);
        WRONG_REASON_MARKERS.forEach((marker) =>
          expect(result.text, report).to.not.include(marker)
        );

        const required = Arr.uniq([scenario.marker, ...(scenario.includes ?? [])]);
        required.forEach((marker) => {
          expect(Is.string(marker), report).to.eql(true);
          expect(result.text, report).to.include(marker);
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
    });
  },
);

/**
 * Helpers:
 */
async function runFixture(scenario: Scenario): Promise<FixtureResult> {
  const executionTimeout = Num.clamp(
    HarnessDuration.timeoutMin,
    HarnessDuration.timeoutMax,
    scenario.timeout ?? HarnessDuration.executionTimeout,
  );
  const timer = Time.timer();
  const fixture = `./src/-test/fixtures/${scenario.fixture}`;
  const child = new Deno.Command(Deno.execPath(), {
    args: ['test', '-P=test', '--no-prompt', ...(scenario.flags ?? []), fixture],
    cwd: PACKAGE_DIR,
    env: { FORCE_COLOR: '1' },
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  const markerReached = Promise.withResolvers<void>();
  let markerSeen = false;
  const observeOutput = (text: string) => {
    if (markerSeen || !stripAnsi(text).includes(scenario.marker)) return;
    markerSeen = true;
    markerReached.resolve();
  };
  const completion = captureChild(child, observeOutput);

  const startup = await withDeadline(
    Promise.race([
      markerReached.promise.then(() => ({ kind: 'marker' as const })),
      completion.then((output) => ({ kind: 'completed' as const, output })),
    ]),
    HarnessDuration.startupTimeout,
  );
  if (startup.kind === 'timeout') {
    return await terminateChild(child, completion, timer.elapsed.msec, 'startup');
  }
  if (startup.value.kind === 'completed') {
    return toFixtureResult(startup.value.output, timer.elapsed.msec);
  }

  const execution = await withDeadline(completion, executionTimeout);
  if (execution.kind === 'timeout') {
    return await terminateChild(child, completion, timer.elapsed.msec, 'execution');
  }
  return toFixtureResult(execution.value, timer.elapsed.msec);
}

async function captureChild(
  child: Deno.ChildProcess,
  onStdout: (text: string) => void,
): Promise<CapturedChild> {
  const [status, stdout, stderr] = await Promise.allSettled(
    [child.status, readOutput(child.stdout, onStdout), readOutput(child.stderr)] as const,
  );

  let captureError: Error | undefined;
  if (status.status === 'rejected') captureError = Err.normalize(status.reason);
  if (stdout.status === 'rejected') captureError ??= Err.normalize(stdout.reason);
  if (stderr.status === 'rejected') captureError ??= Err.normalize(stderr.reason);

  return {
    code: status.status === 'fulfilled' ? status.value.code : -1,
    signal: status.status === 'fulfilled' && Is.string(status.value.signal)
      ? status.value.signal
      : undefined,
    stdout: stdout.status === 'fulfilled' ? stdout.value : '',
    stderr: stderr.status === 'fulfilled' ? stderr.value : '',
    captureError,
  };
}

async function readOutput(
  stream: ReadableStream<Uint8Array>,
  onOutput?: (text: string) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';
  for await (const chunk of stream) {
    text += decoder.decode(chunk, { stream: true });
    onOutput?.(text);
  }
  text += decoder.decode();
  onOutput?.(text);
  return text;
}

async function terminateChild(
  child: Deno.ChildProcess,
  completion: Promise<CapturedChild>,
  elapsed: t.Msecs,
  phase: FixtureTimeout['phase'],
): Promise<FixtureResult> {
  let killError: Error | undefined;
  try {
    child.kill('SIGKILL');
  } catch (primaryError) {
    try {
      child.kill();
    } catch (fallbackError) {
      killError = new AggregateError(
        [Err.normalize(primaryError), Err.normalize(fallbackError)],
        'Failed to terminate sanitizer alarm child.',
      );
    }
  }

  const drain = await withDeadline(completion, HarnessDuration.drainTimeout);
  if (drain.kind === 'timeout') {
    throw new Error(
      `Sanitizer alarm child did not drain within ${HarnessDuration.drainTimeout}ms after its ${phase} timeout.`,
    );
  }
  return toFixtureResult(drain.value, elapsed, { phase, killError });
}

async function withDeadline<T>(promise: Promise<T>, duration: t.Msecs): Promise<DeadlineResult<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<DeadlineResult<T>>((resolve) => {
    timeoutId = setTimeout(() => resolve({ kind: 'timeout' }), duration);
  });

  try {
    return await Promise.race([
      promise.then((value): DeadlineResult<T> => ({ kind: 'value', value })),
      deadline,
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function toFixtureResult(
  output: CapturedChild,
  elapsed: t.Msecs,
  timeout?: FixtureTimeout,
): FixtureResult {
  const channels = Obj.entries({ stdout: output.stdout, stderr: output.stderr });
  const text = Str.trimEdgeNewlines(
    channels
      .map(([, value]) => stripAnsi(value))
      .filter(Is.string)
      .join('\n'),
  );

  return {
    code: output.code,
    elapsed,
    signal: output.signal,
    text,
    timeout,
    captureError: output.captureError,
  };
}

function formatReport(scenario: Scenario, result: FixtureResult) {
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

type CapturedChild = {
  readonly code: number;
  readonly signal?: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly captureError?: Error;
};

type DeadlineResult<T> = { kind: 'value'; value: T } | { kind: 'timeout' };

type FixtureTimeout = {
  readonly phase: 'startup' | 'execution';
  readonly killError?: Error;
};

type FixtureResult = {
  readonly code: number;
  readonly elapsed: t.Msecs;
  readonly signal?: string;
  readonly text: string;
  readonly timeout?: FixtureTimeout;
  readonly captureError?: Error;
};
