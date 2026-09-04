import type { Vite as DriverVite, ViteConfig as DriverViteConfig } from '@sys/driver-vite/t';
import type { t } from '../../src/common.ts';
import type { Start } from '../../src/m.core/m.cli.profiles/u.start/u.gui/t.ts';

export type { Start };

/**
 * Vite path policy captured for one preview build.
 */
export type PreviewBuildPaths = DriverViteConfig.Paths;

/**
 * Immutable package identity propagated through preview generation.
 */
export type PreviewPackageIdentity = Readonly<t.Pkg>;

/**
 * Completed package-pinned development generation passed to GUI composition.
 */
export type PreviewDevelopmentSource = {
  readonly kind: 'development';
  readonly dir: t.StringAbsoluteDir;
  readonly integrity: t.StringHash;
  readonly expectedPkg: PreviewPackageIdentity;
};

/**
 * Package-internal GUI input for one completed preview generation.
 */
export type PreviewStartInput = {
  readonly cwd: t.PiCli.Cwd;
  readonly source: PreviewDevelopmentSource;
};

/**
 * Direct GUI composition callable used by the preview owner.
 */
export type PreviewGuiStart = (input: PreviewStartInput) => Promise<Start.Gui.Outcome>;

/**
 * Immutable worker input for one isolated Vite build.
 */
export type PreviewBuildInput = {
  readonly cwd: t.StringAbsoluteDir;
  readonly paths: PreviewBuildPaths;
  readonly pkg: PreviewPackageIdentity;
  readonly exitOnError: false;
};

/**
 * Finite result returned from one isolated Vite build worker.
 */
export type PreviewBuildResponse = {
  readonly ok: boolean;
  readonly paths: PreviewBuildPaths;
  readonly manifest: DriverVite.Build.Manifest;
};

/**
 * One task-owned temporary generation.
 */
export type PreviewGeneration = {
  /** Exact task-owned output directory retained for one host session. */
  readonly dir: t.StringAbsoluteDir;
  /** Remove only this generation after its host session settles. */
  readonly dispose: () => Promise<void>;
};

/**
 * Build, ownership, and direct GUI boundaries used by preview composition.
 */
export type PreviewDependencies = {
  readonly paths: PreviewBuildPaths;
  readonly allocate: () => Promise<PreviewGeneration>;
  readonly build: (input: PreviewBuildInput) => Promise<PreviewBuildResponse>;
  readonly startGui: PreviewGuiStart;
};
