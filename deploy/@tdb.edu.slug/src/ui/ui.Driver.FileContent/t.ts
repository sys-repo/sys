import type { t } from './common.ts';

/**
 * FileContentDriver.
 *
 * Thin head over `TreeContentDriver` with file-content semantics layered by
 * composition at the call-site/spec level.
 */
export declare namespace FileContentDriver {
  /** Public module surface. */
  export type Lib = {
    readonly orchestrator: (props: OrchestratorProps) => Orchestrator;
  };

  /** Re-exported core loader contract. */
  export type ContentLoader = t.TreeContentDriver.ContentLoader;
  /** Re-exported core runtime shape. */
  export type Orchestrator = t.TreeContentDriver.Orchestrator;
  /** Re-exported core creation args. */
  export type OrchestratorProps = t.TreeContentDriver.OrchestratorProps;
}
