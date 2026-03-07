import { MonorepoCi } from '@sys/monorepo/ci';
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
  const results = await Promise.all(paths.map(async (path) => ({ path, hasBuild: await hasBuildTask(cwd, path) })));
  return results.filter((item) => item.hasBuild).map((item) => item.path);
}

export async function main() {
  const cwd = Deno.cwd();
  const jsrTarget = '.github/workflows/jsr.yaml';
  const buildTarget = '.github/workflows/build.yaml';
  const jsrPaths = toJsrCiPaths(Paths.modules);
  const buildPaths = await toBuildCiPaths(cwd, Paths.modules);
  const branches = ['main', 'phil-work'] as const;
  const env = {
    // SAMPLE_VAR: '${{ vars.SAMPLE_VAR }}',
    // SAMPLE_SECRET: '${{ secrets.SAMPLE_SECRET }}',
  } as const;

  await MonorepoCi.Jsr.write({ branches, cwd, env, paths: jsrPaths, target: jsrTarget });
  await MonorepoCi.Build.write({ branches, cwd, env, paths: buildPaths, target: buildTarget });

  console.info(`${c.green('Updated file:')} ${c.gray(jsrTarget)}`);
  console.info(`${c.green('Updated file:')} ${c.gray(buildTarget)}\n`);
}

async function hasBuildTask(cwd: string, path: string) {
  const denofile = await DenoFile.load(Fs.resolve(cwd, path));
  if (!denofile.ok) return false;
  return typeof denofile.data?.tasks?.build === 'string' && !!denofile.data?.tasks?.build;
}
