import type { t } from './common.ts';

/** Asset entry in a playback timeline manifest. */
export type SpecTimelineAsset = {
  readonly kind: t.Timecode.Playback.MediaKind;
  readonly logicalPath: string;
  readonly hash?: string;
  readonly filename?: string;
  readonly href: string;
  readonly shard?: {
    readonly strategy: 'prefix-range';
    readonly total: number;
    readonly index: number;
  };
  readonly stats?: { readonly bytes?: number; readonly duration?: t.Msecs };
};

/** Assets-manifest document for a playback timeline. */
export type SpecTimelineAssetsManifest = {
  readonly docid: t.StringId;
  readonly assets: readonly SpecTimelineAsset[];
};

/** Playback timeline manifest with typed beat payloads. */
export type SpecTimelineManifest<P = unknown> = {
  readonly docid: t.StringId;
  readonly composition: t.Timecode.Composite.Spec;
  readonly beats: readonly t.Timecode.Playback.Beat<P>[];
};

/** Bundle document pairing playback spec with asset resolution. */
export type SpecTimelineBundle<P = unknown> = {
  readonly docid: t.StringId;
  readonly spec: t.Timecode.Playback.Spec<P>;
  readonly resolveAsset: (args: t.Timecode.Playback.ResolverArgs) => SpecTimelineAsset | undefined;
};
