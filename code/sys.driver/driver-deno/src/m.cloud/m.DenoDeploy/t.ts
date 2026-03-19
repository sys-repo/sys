import type { t } from './common.ts';
import type * as d from './t.deploy.ts';
import type * as f from './t.fmt.ts';
import type * as p from './t.pipeline.ts';
import type * as s from './t.stage.ts';

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
    /** Operator-facing formatting and progress helpers. */
    readonly Fmt: Fmt.Lib;

    /** Materialize a deployable staging root for the selected workspace target. */
    stage(request: Stage.Request): Promise<Stage.Result>;

    /** Deploy a previously staged artifact to Deno Deploy. */
    deploy(request: Deploy.Request): Promise<Deploy.Result>;

    /** Construct a staged deploy pipeline for a selected workspace package. */
    pipeline(request: Pipeline.Request): Pipeline.Handle;
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
   * materializes an isolated deploy root, builds the selected target, and
   * returns the artifact that deploy consumes.
   */
  export namespace Stage {
    export type Root = s.Root;
    export type Request = s.Request;
    export type Result = s.Result;
  }

  /** Deploy execution contracts. */
  export namespace Deploy {
    export type Info = d.Info;
    export type Log = d.Log;
    export type Request = d.Request;
    export type Result = d.Result;
  }

  /** Shared deploy execution settings reused across higher-level orchestration. */
  export type DeployConfig = p.DeployConfig;

  /** Operator-facing formatting contracts. */
  export namespace Fmt {
    export type Lib = f.Lib;
  }

  /** Staged deploy orchestration contracts. */
  export namespace Pipeline {
    export type Verify = p.Verify;
    export type Request = p.Request;
    export type Prepared = p.Prepared;
    export type Step = p.Step;
    export type Result = p.Result;
    export type Handle = p.Handle;
  }
}
