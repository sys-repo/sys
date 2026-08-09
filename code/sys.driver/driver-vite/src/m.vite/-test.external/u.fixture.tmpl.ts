import { cli as tmpl } from '../../../../../-tmpl/src/m.tmpl/mod.ts';
import { Fs, Str } from '../../-test.ts';
import { commandRun, operationRun, runTask, type TaskRun } from './u.fixture.task.ts';

type GeneratedRepo = {
  readonly rootDir: string;
  readonly fooDir: string;
  readonly generate: TaskRun;
  readonly bootstrap: TaskRun;
  readonly build: TaskRun;
};

type GeneratedWorkspaceRepo = {
  readonly rootDir: string;
  readonly fooDir: string;
  readonly barDir: string;
  readonly generateFoo: TaskRun;
  readonly generateBar: TaskRun;
  readonly patch: TaskRun;
  readonly bootstrap: TaskRun;
  readonly build: TaskRun;
};

export async function buildGeneratedRepo(args: {
  sampleName: string;
}): Promise<GeneratedRepo> {
  const { sampleName } = args;
  const fs = await Fs.makeTempDir({ prefix: `${sampleName}.` });
  const rootDir = Fs.join(fs.absolute, 'repo');
  await writeRepoTemplate(fs.absolute, 'repo');

  const projectsDir = Fs.join(rootDir, 'code', 'projects');
  const fooDir = Fs.join(projectsDir, 'foo');
  const generate = await runTmplPkg(projectsDir, 'foo', '@tmp/foo');
  const bootstrap = generate.ok && (await Fs.exists(fooDir))
    ? await runTask(rootDir, 'install')
    : skippedTask(
      rootDir,
      'install',
      'Skipped bootstrap because generated project was unavailable',
    );
  const build = generate.ok && bootstrap.ok && (await Fs.exists(fooDir))
    ? await runTask(fooDir, 'build')
    : skippedTask(fooDir, 'build', 'Skipped build because generated repository was unavailable');

  return { rootDir, fooDir, generate, bootstrap, build };
}

export async function buildGeneratedWorkspaceRepo(args: {
  sampleName: string;
}): Promise<GeneratedWorkspaceRepo> {
  const { sampleName } = args;
  const fs = await Fs.makeTempDir({ prefix: `${sampleName}.` });
  const rootDir = Fs.join(fs.absolute, 'repo');
  await writeRepoTemplate(fs.absolute, 'repo');

  const projectsDir = Fs.join(rootDir, 'code', 'projects');
  const fooDir = Fs.join(projectsDir, 'foo');
  const barDir = Fs.join(projectsDir, 'bar');
  const generateFoo = await runTmplPkg(projectsDir, 'foo', '@tmp/foo');
  const generateBar = await runTmplPkg(projectsDir, 'bar', '@tmp/bar');
  const patch =
    generateFoo.ok && generateBar.ok && (await Fs.exists(fooDir)) && (await Fs.exists(barDir))
      ? await patchWorkspaceRepo(fooDir, barDir)
      : skippedTask(
        fooDir,
        'patch',
        'Skipped workspace patch because generated packages were unavailable',
      );
  const bootstrap = generateFoo.ok && generateBar.ok && patch.ok
    ? await runTask(rootDir, 'install')
    : skippedTask(
      rootDir,
      'install',
      'Skipped workspace bootstrap because generated packages were unavailable',
    );
  const build =
    generateFoo.ok && generateBar.ok && patch.ok && bootstrap.ok && (await Fs.exists(fooDir))
      ? await runTask(fooDir, 'build')
      : skippedTask(
        fooDir,
        'build',
        'Skipped build because generated workspace repo was unavailable',
      );

  return { rootDir, fooDir, barDir, generateFoo, generateBar, patch, bootstrap, build };
}

async function runTmplPkg(cwd: string, dir: string, pkgName: string): Promise<TaskRun> {
  const cmd = [
    'deno',
    'run',
    '-P=integration',
    '@sys/tmpl',
    'pkg',
    '--non-interactive',
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
    return commandRun({ cwd, cmd, ok: true, code: 0, stdout: '', stderr: '' });
  } catch (error) {
    const stderr = error instanceof Error ? (error.stack ?? error.message) : String(error);
    return commandRun({ cwd, cmd, ok: false, code: 1, stdout: '', stderr });
  }
}

async function writeRepoTemplate(cwd: string, dir: string) {
  await tmpl(cwd, {
    _: ['repo'],
    tmpl: 'repo',
    interactive: false,
    bundle: false,
    dryRun: false,
    force: false,
    dir,
  });
}

async function patchWorkspaceRepo(fooDir: string, barDir: string): Promise<TaskRun> {
  const operation = 'workspace patch';

  try {
    await Fs.write(
      Fs.join(barDir, 'src', 'mod.ts'),
      `export const sharedMessage = 'hello from @tmp/bar';\n`,
    );
    await Fs.write(
      Fs.join(fooDir, 'src', '-test', 'entry.tsx'),
      Str.dedent(`
        import { StrictMode } from 'react';
        import { createRoot } from 'react-dom/client';
        import { sharedMessage } from '@tmp/bar';

        const root = createRoot(document.getElementById('root')!);
        root.render(
          <StrictMode>
            <div data-shared={sharedMessage}>{sharedMessage}</div>
          </StrictMode>,
        );
      `),
    );
    return operationRun({ cwd: fooDir, operation, ok: true, code: 0, stdout: '', stderr: '' });
  } catch (error) {
    const stderr = error instanceof Error ? (error.stack ?? error.message) : String(error);
    return operationRun({ cwd: fooDir, operation, ok: false, code: 1, stdout: '', stderr });
  }
}

function skippedTask(cwd: string, task: string, stderr: string): TaskRun {
  return commandRun({
    cwd,
    cmd: ['deno', 'task', task],
    ok: false,
    code: 1,
    stdout: '',
    stderr,
  });
}
