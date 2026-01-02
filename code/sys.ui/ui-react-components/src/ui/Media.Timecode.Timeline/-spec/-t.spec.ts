import type { t } from '../common.ts';

/**
 * Spec shim:
 * Wire-format bundle representing a timecode timeline + media resolver.
 * This is produced by loaders and consumed by the Timeline domain layer.
 */
export type LegacySpecTimelineBundle<P = unknown> = {
  readonly docid: t.StringId;
  readonly spec: t.Timecode.Playback.Spec<P>;
  readonly resolveMedia: t.MediaResolver;
};

/**
 * Spec shim:
 * Assets manifest as emitted by a publish.assets-style service.
 */
export type LegacySpecTimelineAssetsManifest = {
  readonly docid: string;
  readonly assets: LegacySpecTimelineAsset[];
};

export type LegacySpecTimelineAsset = {
  readonly kind: t.Timecode.Playback.MediaKind;
  readonly logicalPath: string;
  readonly href: string;
};

/**
 * Spec shim:
 * Timeline + beats emitted by the tools bundle.
 * Wire-format only; not the internal UI timeline.
 */
export type LegacySpecTimelineManifest<P = unknown> = {
  readonly docid: string;
  readonly composition: t.Timecode.Composite.Spec;
  readonly beats: t.Timecode.Playback.Spec<P>['beats'];
};
