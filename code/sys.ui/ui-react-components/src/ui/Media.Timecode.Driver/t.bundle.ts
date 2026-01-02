import type { t } from '../common.ts';

/**
 * Spec shim:
 * Wire-format bundle representing a timecode timeline + media resolver.
 * This is produced by loaders and consumed by the Timeline domain layer.
 */
export type SpecTimelineBundle<P = unknown> = {
  readonly docid: t.StringId;
  readonly spec: t.Timecode.Playback.Spec<P>;
  readonly resolveMedia: t.MediaResolver;
};

/**
 * Spec shim:
 * Assets manifest as emitted by a publish.assets-style service.
 */
export type SpecTimelineAssetsManifest = {
  readonly docid: string;
  readonly assets: SpecTimelineAsset[];
};

export type SpecTimelineAsset = {
  readonly kind: t.Timecode.Playback.MediaKind;
  readonly logicalPath: string;
  readonly href: string;
};

/**
 * Spec shim:
 * Timeline + beats emitted by the tools bundle.
 * Wire-format only; not the internal UI timeline.
 */
export type SpecTimelineManifest<P = unknown> = {
  readonly docid: string;
  readonly composition: t.Timecode.Composite.Spec;
  readonly beats: t.Timecode.Playback.Spec<P>['beats'];
};
