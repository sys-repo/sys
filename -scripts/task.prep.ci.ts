import { MonorepoCi as Ci } from '@sys/monorepo/ci';
import { Paths } from './-PATHS.ts';

export const JsrIncludePrefixes = [
  'code/sys/',
  'code/sys.ui/',
  'code/sys.driver/',
  'code/sys.model/',
  'code/sys.dev',
  'code/sys.tools',
  'code/-tmpl',
  'deploy/@tdb.edu.slug',
  'deploy/@tdb.slc.std',
] as const;

export function toJsrCiPaths(paths: readonly string[]) {
  return paths.filter((path) => JsrIncludePrefixes.some((item) => path.startsWith(item)));
}

export async function main() {
  const cwd = Deno.cwd();
  const jsrTarget = '.github/workflows/jsr.yaml';
  const buildTarget = '.github/workflows/build.yaml';
  const testTarget = '.github/workflows/test.yaml';
  const jsrPaths = toJsrCiPaths(Paths.modules);
  const on = {
    // pull_request: ['main'],
    push: ['main', 'sample-branch'],
  } as const;
  const env = {
    // SAMPLE_VAR: '${{ vars.SAMPLE_VAR }}',
    // SAMPLE_SECRET: '${{ secrets.SAMPLE_SECRET }}',
  } as const;

  await Ci.Jsr.sync({ cwd, env, log: true, on, source: { paths: jsrPaths }, target: jsrTarget });
  await Ci.Build.sync({ cwd, env, log: true, on, source: { paths: Paths.modules }, target: buildTarget });
  await Ci.Test.sync({ cwd, env, log: true, on, source: { paths: Paths.modules }, target: testTarget });
}
