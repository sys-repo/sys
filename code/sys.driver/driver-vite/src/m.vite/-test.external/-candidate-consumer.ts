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
    // Independent children: a build must not spend the dev startup/cleanup budget or
    // prepare its app-local cache. Neither proof retries a failed cold start.
    for (const mode of ['build', 'dev'] as const) {
      it(`${mode} without application workspace aliases`, async () => {
        const res = await runProbe({
          name: `candidate-consumer.${sample}.${mode}`,
          source: Str.dedent(`
            import { proveCandidate } from './src/m.vite/-test.external/u.fixture.candidate.ts';
            await proveCandidate('${sample}', '${mode}');
          `),
          denoArgs: ['run', '-A', '--node-modules-dir=auto'],
        });
        assertRunOk(res, `Candidate external consumer failed: ${sample} ${mode}`);
        // Keep phase timings visible on green runs without dumping all bundler output.
        console.info(
          res.stdout.split('\n').filter((line) => line.startsWith('[candidate:')).join('\n'),
        );
      });
    }
  });
}
