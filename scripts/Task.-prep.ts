import { c, DenoDeps, Fs, Process } from './common.ts';
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
    deno: './imports.json',
  };

  /**
   * Write to file-system: [deno.json | package.json].
   */
  const deps = res.data?.deps;
  await Fs.writeJson(PATH.package, DenoDeps.toJson('package.json', deps));
  await Fs.writeJson(PATH.deno, DenoDeps.toJson('deno.json', deps));

  /**
   * Run `prep` → `init` commands on sub-modules.
   */
  const sh = (path: string) => Process.sh({ path });
  const module = (...parts: string[]) => sh(Fs.resolve('./code', ...parts));

  const cmd = 'deno task prep && deno task init';
  await module('sys.driver/driver-vite').run(cmd);
  await module('sys.driver/driver-vitepress').run(cmd);

  /**
   * Output: console.
   */
  const fp = (text: string) => i(c.yellow(text)); // fp: file-path
  const fmtSeeFiles = c.gray(`${fp(PATH.deno)} and ${fp(PATH.package)}`);
  console.info();
  console.info(c.brightWhite(`${c.bold('Monorepo Import Map')}`));
  console.info(c.gray(` (dependencies written to):`), fmtSeeFiles);
  console.info();
  console.info(DenoDeps.Fmt.deps(deps, { indent: 1 }));
  console.info();
}
