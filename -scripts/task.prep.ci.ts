import { MonorepoCi as Ci } from '@sys/monorepo/ci';
import { Paths } from './-PATHS.ts';
import { c, DenoFile, Fs } from './common.ts';

export const JsrCiIncludePrefixes = [
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
  return paths.filter((path) => JsrCiIncludePrefixes.some((item) => path.startsWith(item)));
}

export async function toBuildCiPaths(cwd: string, paths: readonly string[]) {
  const results = await Promise.all(
    paths.map(async (path) => ({ path, hasTask: await hasTask(cwd, path, 'build') })),
  );
  return results.filter((item) => item.hasTask).map((item) => item.path);
}

export async function toTestCiPaths(cwd: string, paths: readonly string[]) {
  const results = await Promise.all(
    paths.map(async (path) => ({ path, hasTask: await hasTask(cwd, path, 'test') })),
  );
  return results.filter((item) => item.hasTask).map((item) => item.path);
}

export async function main() {
  const cwd = Deno.cwd();
  const jsrTarget = '.github/workflows/jsr.yaml';
  const buildTarget = '.github/workflows/build.yaml';
  const testTarget = '.github/workflows/test.yaml';
  const jsrPaths = toJsrCiPaths(Paths.modules);
  const buildPaths = await toBuildCiPaths(cwd, Paths.modules);
  const testPaths = await toTestCiPaths(cwd, Paths.modules);
  const on = {
    // pull_request: ['main'],
    push: ['main', 'sample-branch'],
  } as const;
  const env = {
    // SAMPLE_VAR: '${{ vars.SAMPLE_VAR }}',
    // SAMPLE_SECRET: '${{ secrets.SAMPLE_SECRET }}',
  } as const;

  await Ci.Jsr.write({ cwd, env, on, paths: jsrPaths, target: jsrTarget });
  await Ci.Build.write({ cwd, env, on, paths: buildPaths, target: buildTarget });
  await Ci.Test.write({ cwd, env, on, paths: testPaths, target: testTarget });

  console.info(`${c.green('Updated file:')} ${c.gray(jsrTarget)}`);
  console.info(`${c.green('Updated file:')} ${c.gray(buildTarget)}`);
  console.info(`${c.green('Updated file:')} ${c.gray(testTarget)}\n`);
}

async function hasTask(cwd: string, path: string, key: 'build' | 'test') {
  const denofile = await DenoFile.load(Fs.resolve(cwd, path));
  if (!denofile.ok) return false;
  return typeof denofile.data?.tasks?.[key] === 'string' && !!denofile.data?.tasks?.[key];
}
