import type { t } from './common.ts';

/** Type re-exports. */
export * from '../-spec/-t.ts';

export type ContentState = t.TreeContentController.State;
export type SelectionState = t.TreeSelectionController.State;
export type ContentData = Record<string, unknown>;

export type FileContentData = {
  readonly kind: 'file-content';
  readonly docid?: string;
  readonly ref?: string;
  readonly hash?: string;
  readonly contentType?: string;
  readonly content?: unknown;
};

export type PlaybackContentData = {
  readonly kind: 'playback-content';
  readonly docid?: string;
  readonly assets?: unknown;
  readonly playback?: unknown;
};

export type ContentSlotsArgs = {
  readonly content: ContentState;
  readonly selection: SelectionState;
  readonly loading: boolean;
  readonly lastReady?: ContentState;
  readonly theme?: t.CommonTheme;
};
