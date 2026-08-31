import type { Vite as DriverVite, ViteConfig as DriverViteConfig } from '@sys/driver-vite/t';
import type { t } from '../../src/common.ts';

export type PreviewBuildPaths = DriverViteConfig.Paths;

export type PreviewPackageIdentity = Readonly<t.Pkg>;

export type PreviewDevelopmentSource = {
  readonly kind: 'development';
  readonly dir: t.StringAbsoluteDir;
  readonly integrity: t.StringHash;
  readonly expectedPkg: PreviewPackageIdentity;
};

export type PreviewStartInput = {
  readonly cwd: t.PiCli.Cwd;
  readonly source: PreviewDevelopmentSource;
};

export type PreviewGuiStart = (input: PreviewStartInput) => Promise<void>;

export type PreviewGui = {
  readonly start: PreviewGuiStart;
};

export type PreviewBuildInput = {
  readonly cwd: t.StringAbsoluteDir;
  readonly paths: PreviewBuildPaths;
  readonly pkg: PreviewPackageIdentity;
  readonly exitOnError: false;
};

export type PreviewBuildResponse = {
  readonly ok: boolean;
  readonly paths: PreviewBuildPaths;
  readonly manifest: DriverVite.Build.Manifest;
};

export type PreviewGeneration = {
  /** Exact task-owned output directory retained for one host session. */
  readonly dir: t.StringAbsoluteDir;
  /** Remove only this generation after its host session settles. */
  readonly dispose: () => Promise<void>;
};

export type PreviewDependencies = {
  readonly paths: PreviewBuildPaths;
  readonly allocate: () => Promise<PreviewGeneration>;
  readonly build: (input: PreviewBuildInput) => Promise<PreviewBuildResponse>;
  readonly GUI: PreviewGui;
};
