import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * @module
 * Distribution manifest signer driver for detached sign/verify workflows.
 * Implements the `content-manifest` signer target (for example `dist.json`).
 */
/** Detached content-manifest signing and verification type surface. */
export namespace DistSigner {
  /** Manifest kinds supported by the dist signer. */
  export type ManifestKind = 'dist.json' | 'manifest';
  /** Detached signature scheme used by the dist signer. */
  export type SignScheme = 'Ed25519';
  /** Write-back controls for canonical `dist.json` updates. */
  export type WriteBack = {
    /**
     * Write the detached signature descriptor into canonical `dist.json`
     * (`build.sign`) after detached signature generation.
     *
     * Default intent:
     * - `true` for `artifact.kind === 'dist.json'` in `sign` / `sign-verify`
     * - ignored for generic `manifest`
     * - ignored for `verify`
     */
    readonly distSignDescriptor?: boolean;
  };

  /**
   * Success metadata for dist-manifest signer runs.
   * NB: Operational/audit data only (not a trust root).
   */
  export type RunDataSuccess = t.Signer.ResultData & {
    readonly artifactPath: t.StringPath;
    readonly signaturePath: t.StringPath;
    readonly artifactHash: t.StringHash;
    readonly verified: boolean;
  };

  /** Dist signer driver surface. */
  export type Lib = {
    capabilities(): t.Signer.Capabilities;
    run(args: RunArgs): Promise<t.Signer.Result>;
  };

  /** Artifact input for detached sign or verify operations. */
  export type Artifact = {
    /** Manifest file to sign or verify. */
    readonly path: t.StringPath;
    /** Optional manifest kind hint used for canonicalization/write-back rules. */
    readonly kind?: ManifestKind;
  };

  /** Detached signature sidecar input. */
  export type Signature = {
    /** Detached signature file path. */
    readonly path: t.StringPath;
  };

  /** Shared arguments for dist signer runs. */
  export type RunArgsBase = {
    /** Artifact input. */
    readonly artifact: Artifact;
    /** Optional identifier recorded in detached signature metadata. */
    readonly identityRef?: string;
    /** Optional metadata merged into detached signature output. */
    readonly metadata?: Readonly<O>;
    /** Controls manifest write-back after signing. */
    readonly writeBack?: WriteBack;
  };

  /** Arguments for detached signing. */
  export type RunArgsSign = RunArgsBase & {
    readonly mode: 'sign';
    readonly signature: Signature;
    readonly privateKey: CryptoKey;
  };

  /** Arguments for detached verification. */
  export type RunArgsVerify = RunArgsBase & {
    readonly mode: 'verify';
    readonly signature: Signature;
    readonly publicKey: CryptoKey;
  };

  /** Arguments for combined sign → verify runs. */
  export type RunArgsSignVerify = RunArgsBase & {
    readonly mode: 'sign-verify';
    readonly signature: Signature;
    readonly privateKey: CryptoKey;
    readonly publicKey: CryptoKey;
  };

  /** Dist signer run arguments. */
  export type RunArgs = RunArgsSign | RunArgsVerify | RunArgsSignVerify;
}
