import { describe, it, Str } from '../../-test.ts';
import type { proveCandidate } from './u.fixture.candidate.ts';
import { runProbe } from './u.fixture.probe.ts';
import { assertRunOk } from './u.fixture.run.ts';

const SAMPLES = [
  'baseline',
  'ui-static',
  'ui-dynamic',
  'ui-components',
] as const satisfies readonly Parameters<typeof proveCandidate>[0][];

/** Candidate configuration proof, not acceptance of the immutable published driver. */
for (const sample of SAMPLES) {
  describe(`Vite candidate with external application authority: ${sample}`, () => {
    it('build and dev HTTP without application workspace aliases', async () => {
      const res = await runProbe({
        name: `candidate-consumer.${sample}`,
        source: Str.dedent(`
          import { proveCandidate } from './src/m.vite/-test.external/u.fixture.candidate.ts';
          await proveCandidate('${sample}');
        `),
        denoArgs: ['run', '-P=test', '--node-modules-dir=auto'],
      });
      assertRunOk(res, `Candidate external consumer failed: ${sample}`);
    });
  });
}
