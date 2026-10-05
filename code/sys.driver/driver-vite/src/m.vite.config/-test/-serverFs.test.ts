import { describe, it, Str } from '../../-test.ts';
import { runProbe } from '../../m.vite/-test.external/u.fixture.probe.ts';
import { assertRunOk } from '../../m.vite/-test.external/u.fixture.run.ts';
import type { proveServerFs } from './u.fixture.serverFs.ts';

const BASES = ['/', '/app/', '/nested/app/'] as const satisfies readonly Parameters<
  typeof proveServerFs
>[0][];

describe('Config.app filesystem identity (HTTP)', () => {
  for (const [index, base] of BASES.entries()) {
    it(`base ${base}: allows same-root links; rejects escaping links and denied targets`, async () => {
      const result = await runProbe({
        name: `server-fs.${index}`,
        denoArgs: ['run', '-P=test', '--node-modules-dir=auto'],
        source: Str.dedent(`
          import { proveServerFs } from './src/m.vite.config/-test/u.fixture.serverFs.ts';
          await proveServerFs('${base}');
        `),
      });
      assertRunOk(result, `Filesystem HTTP boundary failed: ${base}`);
    });
  }
});
