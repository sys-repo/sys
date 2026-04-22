/**
 * Published-boundary performance measurements for external driver-vite scenarios.
 */
import { SAMPLE, Time, type t } from '../../-test.ts';
import { buildSample } from './u.fixture.build.ts';
import { devSample } from './u.fixture.dev.ts';

export type PerfScenario = 'published-baseline';
export type PerfKind = 'build' | 'dev';
export type PerfPosture = 'cold' | 'warm';

export type PerfSample = {
  readonly kind: PerfKind;
  readonly posture: PerfPosture;
  readonly index: number;
  readonly ok: boolean;
  readonly elapsed: t.Msecs;
  readonly detail: string;
};

export type PerfRun = {
  readonly phase: 'phase.04/checkpoint-a';
  readonly scenario: PerfScenario;
  readonly runs: number;
  readonly deliveryIdentityNote: string;
  readonly samples: readonly PerfSample[];
};

export const Perf = {
  async run(args: {
    scenario?: PerfScenario;
    runs?: number;
  }): Promise<PerfRun> {
    const scenario = args.scenario ?? 'published-baseline';
    const runs = Math.max(1, Math.trunc(args.runs ?? 3));
    const samples = [
      ...(await perf.measureBuild({ scenario, runs })),
      ...(await perf.measureDev({ scenario, runs })),
    ];

    return {
      phase: 'phase.04/checkpoint-a',
      scenario,
      runs,
      deliveryIdentityNote:
        'Current delivery identity remains unstable; see src/m.vite/-test/-bootstrap.delivery.identity.test.ts.',
      samples,
    };
  },
} as const;

const perf = {
  sampleDir(scenario: PerfScenario) {
    if (scenario === 'published-baseline') return SAMPLE.Dirs.samplePublishedBaseline;
    return SAMPLE.Dirs.samplePublishedBaseline;
  },

  async measureBuild(args: { scenario: PerfScenario; runs: number }) {
    const samples: PerfSample[] = [];

    for (let index = 0; index < args.runs; index++) {
      const posture = perf.posture(index);
      const res = await buildSample({
        sampleName: `Vite.perf.${args.scenario}.build.${index + 1}`,
        sampleDir: perf.sampleDir(args.scenario),
      });
      samples.push({
        kind: 'build',
        posture,
        index: index + 1,
        ok: res.build.ok,
        elapsed: res.build.elapsed,
        detail: res.build.ok ? 'build ok' : perf.detailFromBuild(res.build),
      });
    }

    return samples;
  },

  async measureDev(args: { scenario: PerfScenario; runs: number }) {
    const samples: PerfSample[] = [];

    for (let index = 0; index < args.runs; index++) {
      const posture = perf.posture(index);
      const startedAt = Time.now.timestamp;

      try {
        const res = await devSample({
          sampleName: `Vite.perf.${args.scenario}.dev.${index + 1}`,
          sampleDir: perf.sampleDir(args.scenario),
        });
        try {
          samples.push({
            kind: 'dev',
            posture,
            index: index + 1,
            ok: true,
            elapsed: Time.elapsed(startedAt).msec,
            detail: `dev ready at ${res.dev.url}`,
          });
        } finally {
          await res.dev.dispose();
        }
      } catch (error) {
        samples.push({
          kind: 'dev',
          posture,
          index: index + 1,
          ok: false,
          elapsed: Time.elapsed(startedAt).msec,
          detail: perf.detailFromError(error),
        });
      }
    }

    return samples;
  },

  posture(index: number): PerfPosture {
    return index === 0 ? 'cold' : 'warm';
  },

  detailFromBuild(res: t.ViteBuildResponse) {
    const stderr = perf.stripAnsi(res.cmd.output.text.stderr).trim();
    const stdout = perf.stripAnsi(res.cmd.output.text.stdout).trim();
    return stderr || stdout || 'build failed';
  },

  detailFromError(error: unknown) {
    const text = error instanceof Error ? (error.stack ?? error.message) : String(error);
    return perf.stripAnsi(text);
  },

  stripAnsi(text: string) {
    return text.replace(/\u001b\[[0-9;]*m/g, '');
  },
} as const;
