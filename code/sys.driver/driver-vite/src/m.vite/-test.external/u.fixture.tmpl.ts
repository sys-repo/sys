import { cli as tmpl } from '../../../../../-tmpl/src/m.tmpl/mod.ts';
import { Fs, type t } from '../../-test.ts';
import { runTask, type TaskRun } from './u.fixture.task.ts';

type GeneratedRepo = {
  readonly rootDir: string;
  readonly fooDir: string;
  readonly generate: TaskRun;
  readonly build: TaskRun;
};

export async function buildGeneratedRepo(args: {
  sampleName: string;
  repoTemplateDir: t.StringDir;
}): Promise<GeneratedRepo> {
  const { sampleName, repoTemplateDir } = args;
  const fs = await Fs.makeTempDir({ prefix: `${sampleName}.` });
  const rootDir = Fs.join(fs.absolute, 'repo');
  const copy = await Fs.copy(repoTemplateDir, rootDir);
  if (copy.error) throw copy.error;

  const projectsDir = Fs.join(rootDir, 'code', 'projects');
  const fooDir = Fs.join(projectsDir, 'foo');
  const generate = await runTmplPkg(projectsDir, 'foo', '@tmp/foo');
  const build =
    generate.ok && (await Fs.exists(fooDir))
      ? await runTask(fooDir, 'build')
      : {
          cwd: fooDir,
          cmd: ['task', 'build'] as const,
          ok: false,
          code: 1,
          stdout: '',
          stderr: `Skipped build because generated project was unavailable at ${fooDir}`,
        };

  return { rootDir, fooDir, generate, build };
}

async function runTmplPkg(cwd: string, dir: string, pkgName: string): Promise<TaskRun> {
  const cmd = [
    'run',
    '-P=integration',
    '@sys/tmpl',
    'pkg',
    '--no-interactive',
    '--dir',
    dir,
    '--pkgName',
    pkgName,
  ] as const;

  try {
    await tmpl(cwd, {
      _: ['pkg'],
      tmpl: 'pkg',
      interactive: false,
      bundle: false,
      dryRun: false,
      force: false,
      dir,
      pkgName,
    });
    return { cwd, cmd, ok: true, code: 0, stdout: '', stderr: '' };
  } catch (error) {
    const stderr = error instanceof Error ? (error.stack ?? error.message) : String(error);
    return { cwd, cmd, ok: false, code: 1, stdout: '', stderr };
  }
}
