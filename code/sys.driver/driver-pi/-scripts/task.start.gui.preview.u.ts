import { pkg } from '../src/pkg.ts';
import { start, type StartGuiInput } from '../src/m.core/m.cli.profiles/u.start/u.gui.ts';
import type { StartGuiEvidence } from '../src/m.core/m.cli.profiles/u/u.start.gui.service.ts';
import { Fs, Json, Process, Str, type t } from './task.start.gui.preview.common.ts';
import { resolvePreviewDenoDir } from './task.start.gui.preview.deno.ts';
import type {
  PreviewBuildInput,
  PreviewBuildPaths,
  PreviewBuildResponse,
} from './task.start.gui.preview.t.ts';
import { vitePaths } from './u.vite.paths.ts';

export type {
  PreviewBuildInput,
  PreviewBuildPaths,
  PreviewBuildResponse,
} from './task.start.gui.preview.t.ts';

/** Explicit package checkout containing the Vite configuration and generated GUI artifact. */
export const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '..') as t.StringAbsoluteDir;
/** Repository root passed to the existing launcher lifecycle; preview never uses its release store. */
export const WORKSPACE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../../../..') as t.StringDir;
/** Package-owner expectation captured before dependency reads, callbacks, or asynchronous work. */
const EXPECTED_PKG = Object.freeze({ name: pkg.name, version: pkg.version });

const TEMP_OWNER = Str.replaceAll(EXPECTED_PKG.name, '/', '-').after;
export const PREVIEW_TEMP_PREFIX = `${TEMP_OWNER}.start-gui-preview.`;
export const PREVIEW_BUILD_TEMP_PREFIX = `${TEMP_OWNER}.start-gui-preview-build.`;

const BUILD_CHILD = Fs.Path.fromFileUrl(
  new URL('./task.start.gui.preview.build.ts', import.meta.url),
);

export type PreviewGeneration = Readonly<{
  /** Exact task-owned output directory retained for one host session. */
  dir: t.StringAbsoluteDir;
  /** Remove only this generation after its host session settles. */
  dispose(): Promise<void>;
}>;

export type PreviewDependencies = Readonly<{
  readonly paths: PreviewBuildPaths;
  readonly allocate: () => Promise<PreviewGeneration>;
  readonly build: (input: PreviewBuildInput) => Promise<PreviewBuildResponse>;
  readonly startGui: (input: StartGuiInput) => Promise<void>;
}>;

/** Build one isolated generation and remove it only after positive GUI-session settlement. */
export async function main(): Promise<void> {
  await mainWith(Object.freeze({
    paths: vitePaths(PACKAGE_ROOT),
    allocate: allocatePreviewGeneration,
    build: buildPreviewGeneration,
    startGui: start,
  }));
}

/** Internal seam proving owner expectation and task-owned build evidence reach GUI admission. */
export async function mainWith(deps: PreviewDependencies): Promise<void> {
  const configuredCwd = Fs.resolve(deps.paths.cwd);
  if (configuredCwd !== PACKAGE_ROOT) {
    throw new Error('start:gui:preview Vite package root mismatch.');
  }
  const configuredApp = Object.freeze({ ...deps.paths.app });
  const generation = await deps.allocate();
  let primary: Readonly<{ failed: true; cause: unknown }> | undefined;
  let guiInvoked = false;
  let guiSettled = false;

  try {
    const paths: PreviewBuildPaths = Object.freeze({
      cwd: PACKAGE_ROOT,
      app: Object.freeze({ ...configuredApp, outDir: generation.dir }),
    });
    const build = await deps.build(Object.freeze({
      cwd: PACKAGE_ROOT,
      paths,
      pkg: EXPECTED_PKG,
      exitOnError: false,
    }));
    if (!build.ok) throw new Error('start:gui:preview build failed.');

    const dir = Fs.resolve(build.paths.cwd, build.paths.app.outDir) as t.StringAbsoluteDir;
    if (dir !== generation.dir) {
      throw new Error('start:gui:preview build output authority mismatch.');
    }

    const source: StartGuiEvidence = Object.freeze({
      kind: 'development',
      dir,
      integrity: build.manifest.integrity,
      expectedPkg: EXPECTED_PKG,
    });
    guiInvoked = true;
    await deps.startGui(Object.freeze({
      cwd: Object.freeze({ invoked: WORKSPACE_ROOT, git: WORKSPACE_ROOT }),
      source,
    }));
    guiSettled = true;
  } catch (cause) {
    primary = Object.freeze({ failed: true, cause });
  }

  let cleanup: unknown;
  let cleanupFailed = false;
  if (!guiInvoked || guiSettled) {
    try {
      await generation.dispose();
    } catch (cause) {
      cleanupFailed = true;
      cleanup = cause;
    }
  }

  if (primary && cleanupFailed) {
    throw new AggregateError(
      [primary.cause, cleanup],
      'start:gui:preview session and cleanup failed.',
    );
  }
  if (primary) throw primary.cause;
  if (cleanupFailed) {
    throw new Error('start:gui:preview cleanup failed.', { cause: cleanup });
  }
}

/** Run Vite in one isolated child so build-tool signal ownership cannot enter the GUI host. */
export async function buildPreviewGeneration(
  input: PreviewBuildInput,
): Promise<PreviewBuildResponse> {
  const denoDir = await resolvePreviewDenoDir(PACKAGE_ROOT);
  const systemRoot = Deno.build.os === 'windows' ? Deno.env.get('SystemRoot') : undefined;
  const buildChildEnv = Object.freeze({
    DENO_DIR: denoDir,
    FORCE_COLOR: '0',
    PATH: Fs.Path.dirname(Deno.execPath()),
    ...(systemRoot ? { SystemRoot: systemRoot } : {}),
  });
  const exchange = await Fs.makeTempDir({ prefix: PREVIEW_BUILD_TEMP_PREFIX });
  const exchangeDir = exchange.absolute as t.StringAbsoluteDir;
  const inputPath = Fs.join(exchangeDir, 'input.json');
  const outputPath = Fs.join(exchangeDir, 'output.json');
  const outputDir = Fs.resolve(input.paths.cwd, input.paths.app.outDir);
  const packageViteCacheDir = Fs.resolve(input.paths.cwd, 'node_modules/.vite');
  const workspaceViteCacheDir = Fs.resolve(WORKSPACE_ROOT, 'node_modules/.vite');
  let result: PreviewBuildResponse | undefined;
  let primary: unknown;
  let failed = false;

  try {
    await Fs.write(inputPath, Json.stringify(input));
    const child = await Process.capture({
      cmd: Deno.execPath(),
      args: [
        'run',
        '--frozen',
        '--no-prompt',
        '-P=preview-build',
        `--allow-write=${exchangeDir}`,
        `--allow-write=${outputDir}`,
        `--allow-write=${packageViteCacheDir}`,
        `--allow-write=${workspaceViteCacheDir}`,
        BUILD_CHILD,
        inputPath,
        outputPath,
      ],
      cwd: PACKAGE_ROOT,
      clearEnv: true,
      env: buildChildEnv,
      maxStdoutBytes: 1024 * 1024,
      maxStderrBytes: 1024 * 1024,
    });
    if (child.outcome !== 'exited' || !child.success) {
      const diagnostic = child.text.stderr.trim() || child.text.stdout.trim();
      const suffix = diagnostic ? `\n${diagnostic}` : '';
      throw new Error(`start:gui:preview build child failed.${suffix}`);
    }

    result = (await Fs.readJson<PreviewBuildResponse>(outputPath)).data;
    if (!result) throw new Error('start:gui:preview build child output unavailable.');
    if (!result.ok) {
      const diagnostic = child.text.stderr.trim() || child.text.stdout.trim();
      if (diagnostic) console.error(diagnostic);
    }
  } catch (cause) {
    failed = true;
    primary = cause;
  }

  let cleanup: unknown;
  let cleanupFailed = false;
  try {
    await Fs.remove(exchangeDir);
  } catch (cause) {
    cleanupFailed = true;
    cleanup = cause;
  }

  if (failed && cleanupFailed) {
    throw new AggregateError(
      [primary, cleanup],
      'start:gui:preview build operation and cleanup failed.',
    );
  }
  if (failed) throw primary;
  if (cleanupFailed) {
    throw new Error('start:gui:preview build cleanup failed.', { cause: cleanup });
  }
  if (!result) throw new Error('start:gui:preview build child output unavailable.');
  return result;
}

/** Allocate one unique task-owned generation whose exact path is the sole cleanup target. */
export async function allocatePreviewGeneration(): Promise<PreviewGeneration> {
  const created = await Fs.makeTempDir({ prefix: PREVIEW_TEMP_PREFIX });
  let dir: t.StringAbsoluteDir;
  try {
    dir = await Fs.realPath(created.absolute) as t.StringAbsoluteDir;
  } catch (cause) {
    try {
      await Fs.remove(created.absolute);
    } catch (cleanupCause) {
      throw new AggregateError(
        [cause, cleanupCause],
        'start:gui:preview generation allocation failed.',
      );
    }
    throw cause;
  }
  let disposal: Promise<void> | undefined;
  return Object.freeze({
    dir,
    dispose() {
      disposal ??= (async () => {
        await Fs.remove(dir);
      })();
      return disposal;
    },
  });
}
