import type { t } from './common.ts';

export type * from '../t.ts';
export type { ReactNode } from 'react';

/**
 * Sample-owned page presentation contracts.
 */
export declare namespace Page {
  /** Browser composition supplies the configured public base and Vite-managed asset URL. */
  export type Props = {
    origin?: string;
    publicAssetBase: string;
    managedImageUrl: string;
  };

  /** Observed manifest reports and exact-document checksum, not verified payload facts. */
  export type Manifest = t.ManifestObservation;

  export type Manifests = Readonly<Record<t.Audience, Manifest>>;
  export type ManifestUrls = Readonly<Record<t.Audience, string>>;

  export type IntroductionProps = {
    origin?: string;
    privateManifestUrl: string;
  };

  export type ContentProps = {
    bundleSize: number | string;
    manifests: Manifests;
    manifestUrls: ManifestUrls;
  };

  export type ImageExamplesProps = {
    publicAssetBase: string;
    managedImageUrl: string;
  };

  export type ReferenceLinkProps = {
    href: string;
    children: t.ReactNode;
  };
}
