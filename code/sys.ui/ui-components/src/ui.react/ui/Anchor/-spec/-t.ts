import type { t } from '../common.ts';

/** Type re-exports. */
export type * from '../../common.t.ts';

/**
 * Test, Spec types (internal).
 */
export type { DebugProps, DebugSignals } from './-SPEC.Debug.tsx';

/** Shared specimen values; signals and persistence remain owned by Debug. */
export type DebugValues =
  & Pick<
    t.Anchor.Props,
    'theme' | 'href' | 'target' | 'download' | 'enabled' | 'mono' | 'truncate'
  >
  & {
    children?: string;
    /** Harness width constraint, applied only while truncation is enabled. */
    maxWidth?: 120 | 180 | 320;
    examples: DebugExamples;
    /** Undefined selects Anchor.UI; an object selects a semantic link specimen. */
    link?: DebugLink;
  };

/** Single specimen or one of the fixed comparison views. */
export type DebugExamples = 'none' | 'focus' | 'links';

/** Semantic link configuration, including persisted resource intent. */
export type DebugLink =
  & Pick<t.Anchor.Link.Props, 'openIn'>
  & (
    /** Legacy objects without api still select Anchor.Link. */
    | { api?: 'anchor'; resource?: t.Anchor.Link.Props['resource'] }
    /** Persist intent, not undefined: JSON must preserve the Dev.Link opt-out. */
    | { api: 'dev'; resource: 'default' | 'web' | 'none' }
  );
