import type { t } from './common.ts';

export type * from '../common/t.ts';

/** Destinations and observers for the page's independent requests. */
export type StartFetchesArgs = {
  readonly origin: string;
  readonly publicManifestUrl: string;
  readonly onMessage: (value: string) => void;
  readonly onManifest: (audience: t.Audience, manifest: ManifestObservation) => void;
  readonly onBundleSize: (size?: number) => void;
};

/** Manifest reports and exact-document checksum, not verified payload facts. */
export type ManifestObservation = {
  readonly digest: string;
  readonly checksum: string;
  readonly size?: number;
};
