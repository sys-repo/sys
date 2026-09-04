import { pkg } from '../../src/pkg.ts';
import { startDevelopment as startGui } from '../../src/m.core/m.cli.profiles/u.start/u.gui/mod.ts';
import { Fs, Json, Process, Str, type t } from './common.ts';
import { resolvePreviewDenoDir } from './u.deno.ts';
import { vitePaths } from '../u.vite.paths.ts';

/**
 * Canonical Driver Pi package root used by isolated preview builds.
 */
export const PACKAGE_ROOT: t.StringAbsoluteDir = Fs.resolve(import.meta.dirname ?? '.', '../..');

/**
 * Canonical workspace root supplied to direct GUI composition.
 */
export const WORKSPACE_ROOT: t.StringDir = Fs.resolve(PACKAGE_ROOT, '../../..');

const TEMP_OWNER = Str.replaceAll(pkg.name, '/', '-').after;
const BUILD_CHILD = Fs.Path.fromFileUrl(new URL('./-entry.build.ts', import.meta.url));
const DEFAULT_DEPENDENCIES: t.PreviewDependencies = Object.freeze({
  paths: vitePaths(PACKAGE_ROOT),
  allocate: allocatePreviewGeneration,
  build: buildPreviewGeneration,
  startGui,
});

/**
 * Filesystem-safe prefix for task-owned preview generations.
 */
export const PREVIEW_TEMP_PREFIX = `${TEMP_OWNER}.start-gui-preview.`;

/**
 * Filesystem-safe prefix for isolated build exchanges.
 */
export const PREVIEW_BUILD_TEMP_PREFIX = `${TEMP_OWNER}.start-gui-preview-build.`;

/**
 * Build, host, and settle one isolated preview generation.
 */
export async function main(deps: t.PreviewDependencies = DEFAULT_DEPENDENCIES): Promise<void> {
  const outcome = await mainWith(deps);
  if (outcome === 'failed') Deno.exitCode = 1;
}

/**
 * Run preview composition through explicit generation, build, and GUI dependencies.
 */
export async function mainWith(deps: t.PreviewDependencies): Promise<t.Start.Gui.Outcome> {
  const configuredCwd = Fs.resolve(deps.paths.cwd);
  if (configuredCwd !== PACKAGE_ROOT) {
    throw new Error('start:gui:preview Vite package root mismatch.');
  }
  const configuredApp = Object.freeze({ ...deps.paths.app });
  const generation = await deps.allocate();

  let source: t.PreviewDevelopmentSource;
  try {
    const paths: t.PreviewBuildPaths = Object.freeze({
      cwd: PACKAGE_ROOT,
      app: Object.freeze({ ...configuredApp, outDir: generation.dir }),
    });
    const build = await deps.build(Object.freeze({
      cwd: PACKAGE_ROOT,
      paths,
      pkg,
      exitOnError: false,
    }));
    if (!build.ok) throw new Error('start:gui:preview build failed.');

    const dir: t.StringAbsoluteDir = Fs.resolve(build.paths.cwd, build.paths.app.outDir);
    if (dir !== generation.dir) {
      throw new Error('start:gui:preview build output authority mismatch.');
    }
    source = Object.freeze({
      kind: 'development',
      dir,
      integrity: build.manifest.integrity,
      expectedPkg: pkg,
    });
  } catch (cause) {
    try {
      await generation.dispose();
    } catch (cleanupCause) {
      throw new SuppressedError(
        cause,
        cleanupCause,
        'start:gui:preview preparation and cleanup failed.',
      );
    }
    throw cause;
  }

  const outcome = await deps.startGui(Object.freeze({
    cwd: Object.freeze({ invoked: WORKSPACE_ROOT, git: WORKSPACE_ROOT }),
    source,
  }));
  await generation.dispose();
  return outcome;
}

/**
 * Run Vite in one isolated child so build-tool signal ownership cannot enter the GUI host.
 */
export async function buildPreviewGeneration(
  input: t.PreviewBuildInput,
): Promise<t.PreviewBuildResponse> {
  const denoDir = await resolvePreviewDenoDir(PACKAGE_ROOT);
  const systemRoot = Deno.build.os === 'windows' ? Deno.env.get('SystemRoot') : undefined;
  const buildChildEnv = Object.freeze({
    DENO_DIR: denoDir,
    FORCE_COLOR: '0',
    PATH: Fs.Path.dirname(Deno.execPath()),
    ...(systemRoot ? { SystemRoot: systemRoot } : {}),
  });
  const exchange = await Fs.makeTempDir({ prefix: PREVIEW_BUILD_TEMP_PREFIX });
  const exchangeDir: t.StringAbsoluteDir = exchange.absolute;
  const inputPath = Fs.join(exchangeDir, 'input.json');
  const outputPath = Fs.join(exchangeDir, 'output.json');
  const outputDir = Fs.resolve(input.paths.cwd, input.paths.app.outDir);
  const packageViteCacheDir = Fs.resolve(input.paths.cwd, 'node_modules/.vite');
  const workspaceViteCacheDir = Fs.resolve(WORKSPACE_ROOT, 'node_modules/.vite');
  const operation = await settle(async () => {
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

    const result = (await Fs.readJson<t.PreviewBuildResponse>(outputPath)).data;
    if (!result) throw new Error('start:gui:preview build child output unavailable.');
    if (!result.ok) {
      const diagnostic = child.text.stderr.trim() || child.text.stdout.trim();
      if (diagnostic) console.error(diagnostic);
    }
    return result;
  });
  const cleanup = await settle(() => Fs.remove(exchangeDir));

  if (operation.status === 'rejected' && cleanup.status === 'rejected') {
    throw new AggregateError(
      [operation.reason, cleanup.reason],
      'start:gui:preview build operation and cleanup failed.',
    );
  }
  if (operation.status === 'rejected') throw operation.reason;
  if (cleanup.status === 'rejected') {
    throw new Error('start:gui:preview build cleanup failed.', { cause: cleanup.reason });
  }
  return operation.value;
}

/**
 * Allocate one unique task-owned generation whose exact path is the sole cleanup target.
 */
export async function allocatePreviewGeneration(): Promise<t.PreviewGeneration> {
  const created = await Fs.makeTempDir({ prefix: PREVIEW_TEMP_PREFIX });
  let dir: t.StringAbsoluteDir;
  try {
    dir = await Fs.realPath(created.absolute);
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

/**
 * Helpers:
 */
async function settle<T>(operation: () => Promise<T>): Promise<PromiseSettledResult<T>> {
  try {
    return { status: 'fulfilled', value: await operation() };
  } catch (reason) {
    return { status: 'rejected', reason };
  }
}
