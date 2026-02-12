import type { t } from './common.ts';

/**
 * MediaPlaybackDriver.
 *
 * Thin head over `TreeContentDriver`;
 * playback-specific runtime extensions are composed above this seam.
 */
export declare namespace MediaPlaybackDriver {
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
