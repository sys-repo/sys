import { type t, c, DenoDeps, DenoFile, Fs, Process, Tmpl } from './common.ts';
const i = c.italic;

/**
 * Proecss the dependencies into a`deno.json` and `package.json` files.
 */
async function processDeps() {
  const res = await DenoDeps.from('./deps.yaml');
  if (res.error) {
    console.error(res.error);
    return;
  }

  const PATH = {
    package: './package.json',
    deno: './imports.json',
  } as const;

  /**
   * Write to file-system: [deno.json | package.json].
   */
  const deps = res.data?.deps;
  await Fs.writeJson(PATH.package, DenoDeps.toJson('package.json', deps));
  await Fs.writeJson(PATH.deno, DenoDeps.toJson('deno.json', deps));

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

/**
 * Write all {pkg}.ts files with name/version values synced
 * to their corresponding current `deno.json` file values.
 */
async function updatePackages() {
  const ws = await DenoFile.workspace();

  const tmpl = Tmpl.create('./code/-tmpl/pkg', async (e) => {
    const pkg = e.ctx?.pkg as t.Pkg;
    if (typeof pkg !== 'object') throw new Error(`Expected a {pkg} on the context`);
    if (e.target.file.name === 'pkg.ts') {
      const text = e.text.tmpl.replace(/<NAME>/, pkg.name).replace(/<VERSION>/, pkg.version);
      e.modify(text);
    }
  });

  const wait = ws.children.map(async (item) => {
    const targetDir = Fs.join(item.path.dir, 'src');
    const exists = await Fs.exists(Fs.join(targetDir, 'pkg.ts'));
    if (exists) {
      const pkg = item.pkg;
      const ctx = { pkg };
      await tmpl.write(targetDir, { ctx });
    }
  });

  await Promise.all(wait);
}

/**
 * Run `prep` → `init` commands on sub-modules.
 */
async function prepSubmodules() {
  const sh = (path: string) => Process.sh({ path });
  const module = (...parts: string[]) => sh(Fs.resolve('./code', ...parts));

  const cmd = 'deno task prep && deno task init';
  await module('sys.driver/driver-vite').run(cmd);
  await module('sys.driver/driver-vitepress').run(cmd);
}

/**
 * Prepare the [deno.json | package.json] files from
 * definitions within the monorepo's `deps.yaml` configuration.
 */
export async function main() {
  await processDeps();
  await updatePackages();
  await prepSubmodules();
}
