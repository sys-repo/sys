import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * @module
 * Distribution manifest signer driver for detached sign/verify workflows.
 * Implements the `content-manifest` signer target (for example `dist.json`).
 */
export namespace DistSigner {
  /** Library: */
  export type Lib = {
    capabilities(): t.Signer.Capabilities;
    run(args: RunArgs): Promise<t.Signer.Result>;
  };

  export type Artifact = {
    readonly path: t.StringPath;
    readonly kind?: 'dist.json' | 'manifest';
  };

  export type Signature = {
    readonly path: t.StringPath;
  };

  export type RunArgs = {
    readonly mode: t.Signer.Mode;
    readonly artifact: Artifact;
    readonly signature?: Signature;
    readonly identityRef?: string;
    readonly metadata?: Readonly<O>;
  };
}
