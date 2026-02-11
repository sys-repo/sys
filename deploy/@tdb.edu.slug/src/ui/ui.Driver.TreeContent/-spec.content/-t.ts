import type { t } from './common.ts';

/** Type re-exports. */
export * from '../-spec/-t.ts';

export type ContentState = t.TreeContentController.State;
export type SelectionState = t.TreeSelectionController.State;
export type ContentData = FileContentData | PlaybackContentData;

export type FileContentData = {
  readonly kind: 'file-content';
  // readonly index: t.SlugFileContentIndex;
  readonly content: t.SlugFileContentDoc;
};

export type PlaybackContentData = {
  readonly kind: 'playback-content';
  readonly playback: t.SpecTimelineManifest;
  readonly assets: readonly t.SpecTimelineAsset[];
};

export type ContentSlotArgs = {
  readonly content: ContentState;
  readonly selection: SelectionState;
  readonly theme?: t.CommonTheme;
};
