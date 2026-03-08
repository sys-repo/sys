import { DenoFile, Fs, pkg, Process, SAMPLE, type t } from '../../-test.ts';
import { Vite } from '../mod.ts';

type BuiltJsFile = { readonly filename: string; readonly text: string };
type BuiltFiles = {
  readonly html: string;
  readonly dist: t.DistPkg | undefined;
  readonly js: readonly BuiltJsFile[];
};
type BuiltSample = {
  readonly build: t.ViteBuildResponse;
  readonly outDir: string;
  readonly files: BuiltFiles;
};
export type TaskRun = {
  readonly cwd: string;
  readonly cmd: readonly string[];
  readonly ok: boolean;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export async function buildSample(args: {
  sampleName: string;
  sampleDir: t.StringDir;
  entry?: string;
}): Promise<BuiltSample> {
  const { sampleName, sampleDir, entry } = args;
  const fs = SAMPLE.fs(sampleName);
  await Fs.copy(sampleDir, fs.dir);

  if (entry && entry !== './index.html') {
    const source = entry.startsWith('./') ? entry.slice(2) : entry;
    const html = (await Fs.readText(Fs.join(fs.dir, source))).data;
    if (typeof html !== 'string') throw new Error(`Missing fixture entry html: ${entry}`);
    await Fs.write(Fs.join(fs.dir, 'index.html'), html);
  }

  const build = await Vite.build({
    cwd: fs.dir,
    pkg,
    silent: true,
    spinner: false,
    exitOnError: false,
  });

  const outDir = Fs.join(build.paths.cwd, build.paths.app.outDir);
  return {
    build,
    outDir,
    files: await readBuiltFiles(outDir),
  };
}

async function readBuiltFiles(outDir: string): Promise<BuiltFiles> {
  const html = (await Fs.readText(Fs.join(outDir, 'index.html'))).data ?? '';
  const dist = (await Fs.readJson<t.DistPkg>(Fs.join(outDir, 'dist.json'))).data;
  const names = Object.keys(dist?.hash?.parts ?? {});
  const js = await Promise.all(
    names
      .filter((filename) => filename.endsWith('.js'))
      .map(async (filename) => ({
        filename,
        text: (await Fs.readText(Fs.join(outDir, filename))).data ?? '',
      })),
  );

  return { html, dist, js };
}

export async function runTask(cwd: string, task: string, extraArgs: readonly string[] = []): Promise<TaskRun> {
  const cmd = ['task', task, ...extraArgs] as const;
  return runDeno(cwd, cmd);
}

export async function runDeno(cwd: string, cmd: readonly string[]): Promise<TaskRun> {
  const env = minimalTaskEnv();
  const output = await Process.invoke({
    cmd: 'deno',
    args: [...cmd],
    cwd,
    env,
    silent: true,
  });

  return {
    cwd,
    cmd,
    ok: output.success,
    code: output.code,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
  };
}

export async function workspaceRoot() {
  return (await DenoFile.workspace()).dir;
}

function minimalTaskEnv(): Record<string, string> {
  const env = {
    HOME: Deno.env.get('HOME'),
    PATH: Deno.env.get('PATH'),
    TMPDIR: Deno.env.get('TMPDIR'),
    TMP: Deno.env.get('TMP'),
    TEMP: Deno.env.get('TEMP'),
  };

  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}
