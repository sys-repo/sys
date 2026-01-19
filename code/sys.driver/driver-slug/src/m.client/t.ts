import type { t } from './common.ts';

export type Result<T> =
  | {
      readonly ok: true;
      readonly value: T;
    }
  | {
      readonly ok: false;
      readonly error: SlugClientError;
    };

export type SlugClientError =
  | {
      readonly kind: 'http';
      readonly status: number;
      readonly statusText: string;
      readonly url: string;
    }
  | {
      readonly kind: 'schema';
      readonly message: string;
    };

export type SlugClientUrlLib = {
  readonly clean: (docid: string | t.StringId) => t.StringId;
  readonly assetsFilename: (cleanDocid: t.StringId) => string;
  readonly playbackFilename: (cleanDocid: t.StringId) => string;
};

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

export type SlugClientLib = {
  readonly Url: SlugClientUrlLib;
  readonly loadAssetsFromEndpoint: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: RequestInit,
  ) => Promise<Result<SpecTimelineAssetsManifest>>;
  readonly loadPlaybackFromEndpoint: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: RequestInit,
  ) => Promise<Result<SpecTimelineManifest<P>>>;
  readonly loadBundleFromEndpoint: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: RequestInit,
  ) => Promise<Result<SpecTimelineBundle<P>>>;
};
