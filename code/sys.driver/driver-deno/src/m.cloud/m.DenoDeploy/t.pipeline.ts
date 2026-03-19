import type { t } from './common.ts';
import type * as d from './t.deploy.ts';
import type * as s from './t.stage.ts';

/** Shared deploy execution settings reused across higher-level orchestration. */
export type DeployConfig = Omit<d.Request, 'stage'>;

/**
 * Observable staged deploy handle.
 */
export type Handle = t.Lifecycle & {
  /** Original pipeline request. */
  readonly request: Request;

  /** Observable stream of pipeline steps. */
  readonly $: t.Observable<Step>;

  /** Execute the staged deploy pipeline. */
  run(): Promise<Result>;
};

/**
 * Optional post-deploy verification passes.
 */
export type Verify = {
  /** Probe the emitted preview URL and confirm the built app is served. */
  readonly preview?: boolean;
};

/**
 * Request to stage, prepare, deploy, and optionally verify a workspace package.
 */
export type Request = {
  /** Workspace package directory selected for deployment. */
  readonly pkgDir: t.StringDir;

  /** Native deploy execution settings for the downstream Deno Deploy step. */
  readonly config: DeployConfig;

  /** Optional post-deploy verification passes. */
  readonly verify?: Verify;
};

/**
 * Prepared staged artifact details for the deployable root entry pair.
 */
export type Prepared = {
  /** Root directory of the staged deployable artifact. */
  readonly stagedDir: t.StringDir;

  /** Generated staged deploy entry file. */
  readonly entrypoint: t.StringPath;

  /** Generated staged deploy entry path metadata file. */
  readonly entryPaths: t.StringPath;

  /** App config entrypoint consumed by Deno Deploy. */
  readonly appEntrypoint: t.StringPath;

  /** Selected workspace package path relative to the staged workspace root. */
  readonly workspaceTarget: t.StringPath;

  /** Built dist directory path relative to the staged workspace root. */
  readonly distDir: t.StringPath;
};

/**
 * Observable pipeline step emitted as the staged deploy orchestration advances.
 */
export type Step =
  /** Stage execution has started for the selected workspace package. */
  | { readonly kind: 'stage:start'; readonly pkgDir: t.StringDir }
  /** Stage execution completed and produced a staged artifact. */
  | { readonly kind: 'stage:done'; readonly stage: s.Result }
  /** Staged artifact preparation has started for Deno Deploy compatibility. */
  | { readonly kind: 'prepare:start'; readonly stage: s.Result }
  /** Staged artifact preparation completed and produced deploy entry metadata. */
  | { readonly kind: 'prepare:done'; readonly stage: s.Result; readonly prepared: Prepared }
  | {
      /** Native Deno Deploy execution has started. */
      readonly kind: 'deploy:start';
      readonly stage: s.Result;
      readonly config: DeployConfig;
    }
  | {
      /** Native Deno Deploy execution completed successfully. */
      readonly kind: 'deploy:done';
      readonly result: Extract<d.Result, { readonly ok: true }>;
    }
  /** Live preview verification has started. */
  | { readonly kind: 'verify:start'; readonly previewUrl: t.StringUrl }
  /** Live preview verification completed successfully. */
  | { readonly kind: 'verify:done'; readonly previewUrl: t.StringUrl };

/**
 * Successful staged deploy pipeline outcome.
 */
export type Result = {
  /** Staged artifact produced for the selected package. */
  readonly stage: s.Result;

  /** Prepared staged entrypoint details used by the deploy. */
  readonly prepared: Prepared;

  /** Successful native deploy result. */
  readonly deploy: Extract<d.Result, { readonly ok: true }>;
};
