import { MonorepoCi } from '@sys/monorepo/ci';
import { Paths } from './-PATHS.ts';
import { c } from './common.ts';

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

export async function main() {
  const target = '.github/workflows/jsr.yaml';
  const paths = toJsrCiPaths(Paths.modules);
  await MonorepoCi.Jsr.write({ cwd: Deno.cwd(), paths, target });
  console.info(`${c.green('Updated file:')} ${c.gray(target)}\n`);
}
