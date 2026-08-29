import { pkg } from '../../src/pkg.ts';
import { start as startGui } from '../../src/m.core/m.cli.profiles/u.start/u.gui.ts';
import { Fs, Json, Process, Str, type t } from './common.ts';
import { resolvePreviewDenoDir } from './u.deno.ts';
import { vitePaths } from '../u.vite.paths.ts';

type PreviewFailure = {
  readonly cause: unknown;
};

export const PACKAGE_ROOT: t.StringAbsoluteDir = Fs.resolve(import.meta.dirname ?? '.', '../..');
export const WORKSPACE_ROOT: t.StringDir = Fs.resolve(PACKAGE_ROOT, '../../..');

/** Copy generated metadata into finite immutable authority before dependency callbacks run. */
const EXPECTED_PKG: t.PreviewPackageIdentity = Object.freeze({
  name: pkg.name,
  version: pkg.version,
});
const TEMP_OWNER = Str.replaceAll(EXPECTED_PKG.name, '/', '-').after;
const BUILD_CHILD = Fs.Path.fromFileUrl(new URL('./-entry.build.ts', import.meta.url));
const GUI: t.PreviewGui = Object.freeze({
  async start(input) {
    await startGui(input);
  },
});

export const PREVIEW_TEMP_PREFIX = `${TEMP_OWNER}.start-gui-preview.`;
export const PREVIEW_BUILD_TEMP_PREFIX = `${TEMP_OWNER}.start-gui-preview-build.`;

/**
 * Build and host one isolated preview generation.
 *
 * The generation is removed after pre-host failure or successful GUI settlement and retained when
 * GUI invocation rejects without proving host settlement.
 */
export async function main(): Promise<void> {
  await mainWith(Object.freeze({
    paths: vitePaths(PACKAGE_ROOT),
    allocate: allocatePreviewGeneration,
    build: buildPreviewGeneration,
    GUI,
  }));
}

/** Internal preview runner with explicit generation, build, and GUI dependencies. */
export async function mainWith(deps: t.PreviewDependencies): Promise<void> {
  const configuredCwd = Fs.resolve(deps.paths.cwd);
  if (configuredCwd !== PACKAGE_ROOT) {
    throw new Error('start:gui:preview Vite package root mismatch.');
  }
  const configuredApp = Object.freeze({ ...deps.paths.app });
  const generation = await deps.allocate();
  let primary: PreviewFailure | undefined;
  let guiInvoked = false;
  let guiSettled = false;

  try {
    const paths: t.PreviewBuildPaths = Object.freeze({
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

    const source = Object.freeze({
      kind: 'development',
      dir,
      integrity: build.manifest.integrity,
      expectedPkg: EXPECTED_PKG,
    });
    guiInvoked = true;
    await deps.GUI.start(Object.freeze({
      cwd: Object.freeze({ invoked: WORKSPACE_ROOT, git: WORKSPACE_ROOT }),
      source,
    }));
    guiSettled = true;
  } catch (cause) {
    primary = Object.freeze({ cause });
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
  const exchangeDir = exchange.absolute as t.StringAbsoluteDir;
  const inputPath = Fs.join(exchangeDir, 'input.json');
  const outputPath = Fs.join(exchangeDir, 'output.json');
  const outputDir = Fs.resolve(input.paths.cwd, input.paths.app.outDir);
  const packageViteCacheDir = Fs.resolve(input.paths.cwd, 'node_modules/.vite');
  const workspaceViteCacheDir = Fs.resolve(WORKSPACE_ROOT, 'node_modules/.vite');
  let result: t.PreviewBuildResponse | undefined;
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

    result = (await Fs.readJson<t.PreviewBuildResponse>(outputPath)).data;
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
export async function allocatePreviewGeneration(): Promise<t.PreviewGeneration> {
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
