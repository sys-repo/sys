import { Args, Fs, PATHS, Process } from './common.ts';

const argv = [...Deno.args];
const PKG_TMPL = 'pkg';
const template = Args.parse(argv)._[0] ?? '';
const cwd = await Fs.realPath(Fs.cwd());
const repoRootPath = import.meta.dirname ? Fs.join(import.meta.dirname, '..') : Fs.resolve('.');
const repoRoot = await Fs.realPath(repoRootPath);
const packagesDir = Fs.join(repoRoot, PATHS.packages);
const targetCwd = template === PKG_TMPL && cwd === repoRoot ? packagesDir : cwd; // Only package-template runs from repo root are redirected into `code/packages`.

const { code } = await Process.inherit({
  cmd: 'deno',
  args: ['run', '-P=tmpl', '@sys/tmpl', ...argv],
  cwd: targetCwd,
  env: { INIT_CWD: targetCwd, FORCE_COLOR: '1' },
});

Deno.exit(code);
