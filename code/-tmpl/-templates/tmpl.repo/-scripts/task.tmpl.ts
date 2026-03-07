import { Fs } from '@sys/fs';
import { Args } from '@sys/std';
import { Process } from '@sys/process';

const argv = [...Deno.args];
const PKG_TMPL = 'pkg';
const template = Args.parse(argv)._[0] ?? '';
const cwd = await Fs.realPath(Fs.cwd());
const repoRootPath = import.meta.dirname ? Fs.join(import.meta.dirname, '..') : Fs.resolve('.');
const repoRoot = await Fs.realPath(repoRootPath);
const projectsDir = Fs.join(repoRoot, 'code', 'projects');
const targetCwd = template === PKG_TMPL && cwd === repoRoot ? projectsDir : cwd; // Only package-template runs from repo root are redirected into `code/projects`.

const { code } = await Process.inherit({
  cmd: 'deno',
  args: ['run', '-P=integration', '@sys/tmpl', ...argv],
  cwd: targetCwd,
  env: { INIT_CWD: targetCwd, FORCE_COLOR: '1' },
});

Deno.exit(code);
