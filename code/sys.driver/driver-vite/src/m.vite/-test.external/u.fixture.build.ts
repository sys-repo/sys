import { Fs, Process, SAMPLE, Str, type t } from '../../-test.ts';
import { writeLocalFixtureImports } from '../-test/u.bridge.fixture.ts';
import { formatRunFailure } from './u.fixture.task.ts';

const CHILD = Fs.Path.fromFileUrl(new URL('./u.fixture.build.child.ts', import.meta.url));
const PACKAGE_DIR = Fs.Path.fromFileUrl(new URL('../../../', import.meta.url));

type BuiltJsFile = { readonly filename: string; readonly text: string };
type BuiltFiles = {
  readonly html: string;
  readonly dist: t.DistPkg | undefined;
  readonly js: readonly BuiltJsFile[];
};
export type SerializedBuild = {
  readonly ok: t.Vite.Build.Response['ok'];
  readonly elapsed: t.Vite.Build.Response['elapsed'];
  readonly paths: {
    readonly cwd: t.Vite.Build.Response['paths']['cwd'];
    readonly app: Pick<t.Vite.Build.Response['paths']['app'], 'outDir'>;
  };
  readonly cmd: {
    readonly input: t.Vite.Build.Response['cmd']['input'];
    readonly output: {
      readonly code: t.Vite.Build.Response['cmd']['output']['code'];
      readonly text: Pick<t.Vite.Build.Response['cmd']['output']['text'], 'stdout' | 'stderr'>;
    };
  };
};
export type BuiltSample = {
  readonly build: SerializedBuild;
  readonly outDir: string;
  readonly files: BuiltFiles;
};

type BuildDiagnostic = {
  readonly ok: boolean;
  readonly paths: Pick<SerializedBuild['paths'], 'cwd'>;
  readonly cmd: SerializedBuild['cmd'];
};

/**
 * Preserve a failed published-fixture build's command context for external-lane diagnosis.
 */
export function assertBuildOk(build: BuildDiagnostic, message: string) {
  if (build.ok) return;

  throw new Error(
    formatRunFailure({
      message,
      status: `exit ${build.cmd.output.code}`,
      cwd: build.paths.cwd,
      invocation: `cmd: ${build.cmd.input}`,
      stdout: build.cmd.output.text.stdout,
      stderr: build.cmd.output.text.stderr,
    }),
  );
}

export async function buildSample(args: {
  sampleName: string;
  sampleDir: t.StringDir;
  entry?: string;
  local?: boolean;
}): Promise<BuiltSample> {
  const { sampleName, sampleDir, entry, local = false } = args;
  const fs = await SAMPLE.fs(sampleName);
  await Fs.remove(fs.dir);
  await Fs.copy(sampleDir, fs.dir);

  if (entry && entry !== './index.html') {
    const source = entry.startsWith('./') ? entry.slice(2) : entry;
    const html = (await Fs.readText(Fs.join(fs.dir, source))).data;
    if (typeof html !== 'string') throw new Error(`Missing fixture entry html: ${entry}`);
    await Fs.write(Fs.join(fs.dir, 'index.html'), html);
  }
  if (local) await writeLocalFixtureImports(fs.dir);

  const resultPath = Fs.join(fs.dir, '.sys-vite-build-result.json');

  // Importing fixture vite.config.ts in the test process loads rolldown@1.2.1, whose SignalExit
  // installs process signal listeners without a public removal API. Isolate that world here.
  const childArgs = ['run', '-P=test', CHILD, fs.dir, resultPath];
  const child = await Process.capture({
    cmd: Deno.execPath(),
    args: childArgs,
    cwd: PACKAGE_DIR,
    timeoutMs: 120_000,
    maxStdoutBytes: 2_000_000,
    maxStderrBytes: 2_000_000,
    killGraceMs: 1_000,
  });
  if (child.outcome !== 'exited' || !child.success) {
    throw new Error(
      Str.dedent(`
        Vite fixture build process failed.
        cmd: ${[Deno.execPath(), ...childArgs].join(' ')}
        cwd: ${PACKAGE_DIR}
        outcome: ${child.outcome}
        termination: ${child.termination.reason ?? 'none'}
        code: ${child.code ?? 'none'}
        signal: ${child.signal ?? 'none'}
        stderr:
        ${child.text.stderr || '(empty)'}
        stdout:
        ${child.text.stdout || '(empty)'}
      `),
    );
  }

  const build = (await Fs.readJson<SerializedBuild>(resultPath)).data;
  if (!build) throw new Error(`Vite fixture build result missing: ${resultPath}`);

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
