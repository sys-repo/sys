import type { t } from './common.ts';

/**
 * Tools for staging and deploying workspace targets to Deno Deploy.
 *
 * Design:
 * - the selected workspace target is the caller input
 * - staging resolves that target into a deployable root
 * - deploy operates on the staged result rather than re-resolving workspace state
 */
export declare namespace DenoDeploy {
  /** Library surface for Deno Deploy staging and execution. */
  export type Lib = {
    /** Materialize a deployable staging root for the selected workspace target. */
    stage(request: Stage.Request): Promise<Stage.Result>;

    /** Deploy a previously staged artifact to Deno Deploy. */
    deploy(request: Deploy.Request): Promise<Deploy.Result>;
  };

  /** Selected workspace target to stage for deployment. */
  export type Target = {
    /** Directory of the workspace module/app selected for deployment. */
    readonly dir: t.StringDir;
  };

  /**
   * Staging contracts.
   *
   * Staging is the primary operation in this API: it resolves workspace truth,
   * materializes an isolated deploy root, and returns the artifact that deploy consumes.
   */
  export namespace Stage {
    /** Ownership model for the staging root: `temp` is driver-owned, `path` is caller-owned. */
    export type Root =
      | {
          /** Driver-owned temporary staging root. */
          readonly kind: 'temp';
        }
      | {
          /** Caller-owned staging root path. */
          readonly kind: 'path';
          /** Directory to use as the staging root. */
          readonly dir: t.StringDir;
        };

    /** Request to stage a selected workspace target. */
    export type Request = {
      /** Workspace target to materialize for deployment. */
      readonly target: DenoDeploy.Target;

      /** Optional staging root policy; when omitted, the driver chooses the default strategy. */
      readonly root?: Root;
    };

    /** Resolved staged artifact bridging workspace resolution to downstream deploy. */
    export type Result = {
      /** Target that was selected for staging. */
      readonly target: DenoDeploy.Target;

      /** Resolved workspace context used during staging. */
      readonly workspace: t.DenoWorkspace;

      /** Root directory of the staged deployable artifact. */
      readonly root: t.StringDir;

      /** Deploy entry path inside the staged root. */
      readonly entry: t.StringPath;
    };
  }

  /** Deploy execution contracts. */
  export namespace Deploy {
    /** Request to deploy a staged artifact. */
    export type Request = {
      /** Previously staged deploy artifact to deploy. */
      readonly stage: DenoDeploy.Stage.Result;

      /** Deno Deploy application name. */
      readonly app: string;

      /** Optional Deno Deploy organization name. */
      readonly org?: string;

      /** Optional auth token for Deno Deploy. */
      readonly token?: string;

      /** Optional Deno config path to pass through to the native CLI. */
      readonly config?: t.StringPath;

      /** Deploy directly to production when true. */
      readonly prod?: boolean;

      /** Allow node_modules to be uploaded when true. */
      readonly allowNodeModules?: boolean;

      /** Skip waiting for the remote build to complete when true. */
      readonly noWait?: boolean;

      /** Suppress native CLI output when true. */
      readonly silent?: boolean;
    };

    /** Outcome of a deploy attempt. */
    export type Result =
      | {
          /** Deploy completed successfully. */
          readonly ok: true;
          /** Native process exit code. */
          readonly code: number;
          /** Captured process stdout. */
          readonly stdout: string;
          /** Captured process stderr. */
          readonly stderr: string;
          /** Deno Deploy build details parsed from native output when available. */
          readonly deploy?: {
            /** Build URL in the Deno Deploy console. */
            readonly revisionUrl?: string;
            /** Preview URL emitted by the deploy. */
            readonly previewUrl?: string;
          };
        }
      | {
          /** Deploy failed. */
          readonly ok: false;
          /** Native process exit code when available. */
          readonly code: number;
          /** Captured process stdout when available. */
          readonly stdout: string;
          /** Captured process stderr when available. */
          readonly stderr: string;
          /** Deno Deploy build details parsed from native output when available. */
          readonly deploy?: {
            /** Build URL in the Deno Deploy console. */
            readonly revisionUrl?: string;
            /** Preview URL emitted by the deploy. */
            readonly previewUrl?: string;
          };
        }
      | {
          /** Deploy failed before a process result was produced. */
          readonly ok: false;
          /** Underlying deploy error. */
          readonly error: unknown;
        };
  }
}
