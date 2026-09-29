import type { Vite as DriverVite, ViteConfig as DriverViteConfig } from '@sys/driver-vite/t';
import type { t } from '../../src/common.ts';
import type { Start } from '../../src/m.cli/m.profiles/u.start/u.gui/t.ts';

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
  readonly pin: t.DistPin;
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
  /** Optional proof-only child dependency constraint, forwarded into Vite unchanged. */
  readonly dependencyPolicy?: DriverVite.Build.Args['dependencyPolicy'];
};

/**
 * Result of one isolated Vite build worker: success reports saved build output,
 * not subsequent tree verification. `pin` identifies the selected payload;
 * `manifestChecksum` identifies only the exact saved manifest bytes.
 * The GUI host must still verify the tree against the pin before readiness.
 */
export type PreviewBuildResponse =
  & { readonly paths: PreviewBuildPaths }
  & (
    | { readonly ok: true; readonly pin: t.DistPin; readonly manifestChecksum: t.StringHash }
    | { readonly ok: false }
  );

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
