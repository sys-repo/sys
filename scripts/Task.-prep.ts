import { c, DenoDeps, Fs } from './common.ts';
const i = c.italic;

/**
 * Prepare the [deno.json | package.json] files from
 * definitions within the monorepo's `deps.yaml` configuration.
 */
export async function main() {
  const res = await DenoDeps.from('./deps.yaml');
  if (res.error) return console.error(res.error);

  const PATH = {
    package: './package.json',
    deno: './deno.imports.json',
  };

  /**
   * Write to file-system: [deno.json | package.json].
   */
  const deps = res.data?.deps;
  await Fs.writeJson(PATH.package, DenoDeps.toJson('package.json', deps));
  await Fs.writeJson(PATH.deno, DenoDeps.toJson('deno.json', deps));

  /**
   * Run `prep` command on sub-modules.
   */
  await import('../code/sys.driver/driver-vite/-scripts/-prep.ts');
  await import('../code/sys.driver/driver-vitepress/-scripts/-prep.ts');

  /**
   * Output: console.
   */
  const fp = (text: string) => i(c.yellow(text)); // fp: file-path
  const fmtSeeFiles = c.gray(`${fp(PATH.deno)} and ${fp(PATH.package)}`);
  console.info();
  console.info(c.brightWhite(`${c.bold('Import Map')}`));
  console.info(c.green(` (dependencies written to):`), fmtSeeFiles);
  console.info();
  console.info(DenoDeps.Fmt.deps(deps, { indent: 0 }));
  console.info();
}
