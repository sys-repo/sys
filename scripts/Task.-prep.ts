import { c, DenoDeps, Fs } from './common.ts';
const i = c.italic;

/**
 * Prepare the [package.json] and [deno.json] files
 * from definieions within `imports.yaml`
 */
export async function main() {
  const res = await DenoDeps.fromYaml('./deps.yaml');
  if (res.error) return console.error(res.error);

  const PATH = {
    package: './package.json',
    deno: './deno.imports.json',
  };

  /**
   * Write to file-system.
   */
  const deps = res.data?.deps;
  await Fs.writeJson(PATH.package, DenoDeps.toPackageJson(deps));
  await Fs.writeJson(PATH.deno, DenoDeps.toDenoJson(deps));

  /**
   * Output: console.
   */
  const fp = (text: string) => i(c.yellow(text)); // fp: file-path
  const fmtSeeFiles = c.gray(`${fp(PATH.deno)} and ${fp(PATH.package)}`);
  console.info();
  console.info(c.brightWhite(`${c.bold('Import Map')}`));
  console.info(c.green(`(dependencies written to):`), fmtSeeFiles);
  console.info();
  console.info(DenoDeps.Fmt.deps(deps, { indent: 0 }));
  console.info();
}
