import { type t, c, DenoDeps, DenoFile, Err, Fs, Process, TmplEngine } from './common.ts';
const i = c.italic;
const TMPL_MODULE_PATH = './code/-tmpl' as const;

type TCtx = { pkg: t.Pkg };

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
 *
 * Deferred lift:
 *
 * await Monorepo.Pkg.sync({
 *   cwd: Deno.cwd(),
 *   log: true,
 *   source: { include: ['./code/**/deno.json', './deploy/**/deno.json'] },
 * });
 */
async function updatePackages() {
  const errors = Err.errors();
  const ws = await DenoFile.workspace();

  const tmplDir = Fs.toDir('./code/-tmpl/-templates/tmpl.pkg/');
  if (!(await tmplDir.exists())) {
    throw new Error(`The pkg template could not be found. Path: ${tmplDir.absolute}`);
  }
  const tmpl = TmplEngine.makeTmpl(tmplDir.absolute, async (e) => {
    const ctx = e.ctx as TCtx;

    const pkg = ctx.pkg;
    if (typeof pkg !== 'object') {
      const err = `[UpdatePackages] Template expected a {pkg} on the context. Template target: ${e.target.relative}`;
      errors.push(err);
      return;
    }

    if (e.text && e.target.filename === 'pkg.ts') {
      const text = e.text.replace(/<NAME>/, pkg.name).replace(/<VERSION>/, pkg.version);
      e.modify(text);
    }
  });

  for (const item of ws.children) {
    const targetDir = Fs.join(item.path.dir, 'src');
    const exists = await Fs.exists(Fs.join(targetDir, 'pkg.ts'));
    if (exists) {
      const pkg = item.pkg;
      const ctx: TCtx = { pkg };
      await tmpl.write(targetDir, { ctx });
    }
  }

  const error = errors.toError();
  if (error) console.error(error);
  return { error };
}

/**
 * Run `prep` → `init` commands on sub-modules.
 */
async function prepSubmodules() {
  const ws = await DenoFile.workspace();
  for (const item of ws.children) {
    if (item.path.dir === Fs.resolve(TMPL_MODULE_PATH)) continue;
    const tasks = item.denofile.tasks;
    if (tasks) {
      if (tasks.prep) await runTaskOrThrow(item.path.dir, 'deno task prep');
      if (tasks.init) await runTaskOrThrow(item.path.dir, 'deno task init');
    }
  }
}

/**
 * The template bundle is a critical generated artifact consumed across the repo.
 * Root prep owns this explicitly rather than relying on generic workspace traversal.
 */
async function prepTmplModule() {
  await runTaskOrThrow(TMPL_MODULE_PATH, 'deno task prep');
}

async function runTaskOrThrow(path: string, command: string) {
  const parts = command.trim().split(/\s+/);
  const [cmd, ...args] = parts;
  const res = await Process.inherit({ cmd, args, cwd: path });
  if (res.success) return;
  throw new Error(`Failed in ${path}: ${command}`);
}

/**
 * Prepare the [deno.json | package.json] files from
 * definitions within the monorepo's `deps.yaml` configuration.
 */
export async function main() {
  await processDeps();
  await updatePackages();
  await prepSubmodules();
  await prepTmplModule();
}
