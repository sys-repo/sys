import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * @module
 * Distribution manifest signer driver for detached sign/verify workflows.
 * Implements the `content-manifest` signer target (for example `dist.json`).
 */
export namespace DistSigner {
  export type ManifestKind = 'dist.json' | 'manifest';

  /** Library: */
  export type Lib = {
    capabilities(): t.Signer.Capabilities;
    run(args: RunArgs): Promise<t.Signer.Result>;
  };

  export type Artifact = {
    readonly path: t.StringPath;
    readonly kind?: ManifestKind;
  };

  export type Signature = {
    readonly path: t.StringPath;
  };

  export type RunArgsBase = {
    readonly artifact: Artifact;
    readonly identityRef?: string;
    readonly metadata?: Readonly<O>;
  };

  export type RunArgsSign = RunArgsBase & {
    readonly mode: 'sign';
    readonly signature: Signature;
  };

  export type RunArgsVerify = RunArgsBase & {
    readonly mode: 'verify';
    readonly signature: Signature;
  };

  export type RunArgsSignVerify = RunArgsBase & {
    readonly mode: 'sign-verify';
    readonly signature: Signature;
  };

  export type RunArgs = RunArgsSign | RunArgsVerify | RunArgsSignVerify;
}
