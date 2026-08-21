import { expect, Is, Obj, Path, Str } from './common.ts';
import type { t } from './common.ts';
import { BddMarker } from './fixtures/u.bdd-markers.ts';
import { type FixtureProcessResult, runFixtureProcess } from './u.fixture-process.ts';

type Scenario = {
  readonly name: string;
  readonly files: readonly string[];
  readonly outcome: 'pass' | 'fail';
  readonly includes: readonly string[];
  readonly excludes?: readonly string[];
  readonly occurrences?: Readonly<Record<string, number>>;
};
const PACKAGE_DIR = Path.fromFileUrl(new URL('../../', import.meta.url));
const HarnessDuration = {
  startupTimeout: 30_000,
  executionTimeout: 15_000,
  drainTimeout: 5_000,
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
const scenarios: readonly Scenario[] = [
  {
    name: 'failed nested step → fails its parent and continues teardown/siblings',
    files: ['fixture.bdd-nested-failure.ts'],
    outcome: 'fail',
    includes: [
      BddMarker.nestedFailure,
      BddMarker.nestedFailureLater,
      `${BddMarker.nestedFailure}:afterEach`,
      `${BddMarker.nestedFailure}:afterAll`,
    ],
  },
  {
    name: 'ignored nested step → suppresses its body without failing its parent',
    files: ['fixture.bdd-nested-skip.ts'],
    outcome: 'pass',
    includes: [BddMarker.skippedLater],
    excludes: [BddMarker.skippedBody],
  },
  {
    name: 'nested permissions → fail clearly instead of disappearing',
    files: ['fixture.bdd-nested-permission.ts'],
    outcome: 'fail',
    includes: [
      BddMarker.nestedPermission,
      'does not support permissions; Deno.TestContext.step cannot enforce it.',
    ],
    excludes: [BddMarker.nestedPermissionBody],
  },
  {
    name: 'nested timeout → fails clearly instead of disappearing',
    files: ['fixture.bdd-nested-timeout.ts'],
    outcome: 'fail',
    includes: [
      BddMarker.nestedTimeout,
      'does not support timeout; Deno.TestContext.step cannot enforce it.',
    ],
    excludes: [BddMarker.nestedTimeoutBody],
  },
  {
    name: 'nested focus → selects its leaf and marks the top-level suite focused',
    files: ['fixture.bdd-nested-focus.ts'],
    outcome: 'fail',
    includes: [BddMarker.nestedFocus, 'Test failed because the "only" option was used'],
    excludes: [BddMarker.nestedFocusSibling],
    occurrences: { [BddMarker.nestedFocus]: 1, '1 filtered out': 1 },
  },
  {
    name: 'top-level focus → delegates selection and focused-run failure to Deno',
    files: ['fixture.bdd-top-focus.ts'],
    outcome: 'fail',
    includes: [BddMarker.topFocus, 'Test failed because the "only" option was used'],
    excludes: [BddMarker.topFocusSibling],
    occurrences: { [BddMarker.topFocus]: 1, '1 filtered out': 1 },
  },
  {
    name: 'top-level hook after registration → fails at the registration boundary',
    files: ['fixture.bdd-registration-guard.ts'],
    outcome: 'pass',
    includes: [BddMarker.registrationGuard],
  },
  {
    name: 'rejected suite registration → rolls back escaped handles and focus state',
    files: ['fixture.bdd-registration-transaction.ts'],
    outcome: 'pass',
    includes: [BddMarker.registrationTransaction, BddMarker.registrationTransactionControl],
    excludes: [BddMarker.registrationTransactionBody, '"only" option was used'],
    occurrences: { [BddMarker.registrationTransactionControl]: 1 },
  },
  {
    name: 'unknown runtime options → fail defensively at registration',
    files: ['fixture.bdd-runtime-validation.ts'],
    outcome: 'pass',
    includes: [BddMarker.runtimeValidation],
  },
  {
    name: 'modifier precedence → keeps ignored focus inert and exposes todo names',
    files: ['fixture.bdd-modifiers.ts'],
    outcome: 'pass',
    includes: [
      BddMarker.modifierControl,
      '[todo] body-less todo suite',
      '[todo] body-less todo test',
      'ignored suite with unsupported policy',
      'ignored test with unsupported policy',
    ],
    excludes: [BddMarker.modifierBody, BddMarker.ignoredFocusBody, '"only" option was used'],
    occurrences: { [BddMarker.modifierControl]: 1 },
  },
  {
    name: 'top-level permissions → forward to Deno',
    files: ['fixture.bdd-top-permission.ts'],
    outcome: 'pass',
    includes: [`${BddMarker.topPermission}:blocked`],
  },
  {
    name: 'top-level timeout → fails through Deno timeout authority',
    files: ['fixture.bdd-top-timeout.ts'],
    outcome: 'fail',
    includes: [BddMarker.topTimeout, 'Test timed out after 50ms'],
  },
  {
    name: 'before-hook failure → still executes each/all teardown',
    files: ['fixture.bdd-before-hook-failure.ts'],
    outcome: 'fail',
    includes: [
      'SYS:BDD:before-hook-failure',
      BddMarker.beforeFailureAfterEach,
      BddMarker.beforeFailureAfterAll,
    ],
    excludes: [BddMarker.beforeFailureBody],
  },
  {
    name: 'after-hook failure → still executes later teardown hooks',
    files: ['fixture.bdd-after-hook-failure.ts'],
    outcome: 'fail',
    includes: [
      'SYS:BDD:after-hook-failure',
      BddMarker.afterFailureBody,
      BddMarker.afterFailureSecondHook,
      BddMarker.afterFailureAfterAll,
    ],
  },
  {
    name: 'test modules → isolate shared mutable imports and adapter state',
    files: ['fixture.bdd-isolation-a.ts', 'fixture.bdd-isolation-b.ts'],
    outcome: 'pass',
    includes: [`${BddMarker.isolation}:A:1`, `${BddMarker.isolation}:B:1`],
    excludes: [`${BddMarker.isolation}:A:2`, `${BddMarker.isolation}:B:2`],
  },
];

Deno.test({
  name: 'Deno-native BDD contracts',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn(context) {
    await context.step('public entry points → share one registration symbol set', async () => {
      const leaf = await import('@sys/types/testing');
      const std = await import('@sys/std/testing');
      const facade = await import('@sys/testing');
      const stdServer = await import('@sys/std/testing/server');
      const server = await import('@sys/testing/server');
      const names = [
        'describe',
        'it',
        'beforeAll',
        'beforeEach',
        'afterEach',
        'afterAll',
      ] as const;

      names.forEach((name) => {
        expect(std[name]).to.equal(leaf[name]);
        expect(facade[name]).to.equal(leaf[name]);
        expect(stdServer[name]).to.equal(leaf[name]);
        expect(server[name]).to.equal(leaf[name]);
      });
    });

    for (const scenario of scenarios) {
      await context.step(scenario.name, async () => {
        const result = await runScenario(scenario);
        const report = formatReport(scenario, result);
        if (result.captureError) throw new Error(report, { cause: result.captureError });
        if (result.timeout) throw new Error(report);

        expect(result.markerReached, report).to.eql(true);
        WRONG_REASON_MARKERS.forEach((marker) => {
          expect(result.text, report).to.not.include(marker);
        });
        scenario.includes.forEach((marker) => {
          expect(Is.string(marker), report).to.eql(true);
          expect(result.text, report).to.include(marker);
        });
        scenario.excludes?.forEach((marker) => {
          expect(result.text, report).to.not.include(marker);
        });
        Obj.entries(scenario.occurrences ?? {}).forEach(([marker, count]) => {
          expect(Str.count(result.text, marker), report).to.eql(count);
        });

        if (scenario.outcome === 'pass') expect(result.code, report).to.eql(0);
        else expect(result.code, report).to.not.eql(0);
      });
    }
  },
});

/**
 * Helpers:
 */
async function runScenario(scenario: Scenario): Promise<FixtureProcessResult> {
  const files = scenario.files.map((file) => `./src/-test/fixtures/${file}`);
  // The test:process fixture check owns type safety; each isolated child proves runtime behavior only.
  return await runFixtureProcess({
    label: 'BDD fixture child',
    args: ['test', '-P=test-process', '--no-prompt', '--no-check', ...files],
    cwd: PACKAGE_DIR,
    env: { FORCE_COLOR: '1' },
    marker: BddMarker.ready,
    startupTimeout: HarnessDuration.startupTimeout,
    executionTimeout: HarnessDuration.executionTimeout,
    drainTimeout: HarnessDuration.drainTimeout,
  });
}

function formatReport(scenario: Scenario, result: FixtureProcessResult): string {
  return Str.dedent(`
    BDD fixture did not match its contract.

    scenario: ${scenario.name}
    fixtures: ${scenario.files.join(', ')}
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
