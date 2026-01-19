import type { t } from './common.ts';

export type SpecTimelineAsset = {
  readonly kind: t.Timecode.Playback.MediaKind;
  readonly logicalPath: string;
  readonly hash?: string;
  readonly filename?: string;
  readonly href: string;
  readonly stats?: {
    readonly bytes?: number;
    readonly duration?: t.Msecs;
  };
};

export type SpecTimelineAssetsManifest = {
  readonly docid: t.StringId;
  readonly assets: readonly SpecTimelineAsset[];
};

export type SpecTimelineManifest<P = unknown> = {
  readonly docid: t.StringId;
  readonly composition: t.Timecode.Composite.Spec;
  readonly beats: readonly t.Timecode.Playback.Beat<P>[];
};

export type SpecTimelineBundle<P = unknown> = {
  readonly docid: t.StringId;
  readonly spec: t.Timecode.Playback.Spec<P>;
  readonly resolveAsset: (args: t.Timecode.Playback.ResolverArgs) => SpecTimelineAsset | undefined;
};
