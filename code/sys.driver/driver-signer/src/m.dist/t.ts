import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Detached content-manifest signing and verification contracts.
 * DistSigner never verifies referenced payload files.
 */
export declare namespace DistSigner {
  /** Dist signer driver surface. */
  export type Lib = {
    /** Report supported operations without reading artifacts or using keys. */
    capabilities(): t.Signer.Capabilities;
    /**
     * Sign or verify the selected document using caller-supplied Ed25519 keys.
     * DistSigner never verifies referenced payload files.
     * Verification does not write; signing can update manifest and sidecar without rollback.
     */
    run(args: Run.Args): Promise<t.Signer.Result>;
  };

  /**
   * Contracts for detached document sign and verify operations.
   */
  export namespace Run {
    /** Dist signer run arguments. */
    export type Args = ArgsSign | ArgsVerify | ArgsSignVerify;

    /**
     * Success metadata for dist-manifest signer runs.
     * NB: Operational/audit data only (not a trust root).
     */
    export type DataSuccess = t.Signer.ResultData & {
      readonly artifactPath: t.StringPath;
      readonly signaturePath: t.StringPath;
      readonly artifactHash: t.StringHash;
      readonly verified: boolean;
    };

    /** Shared arguments for dist signer runs. */
    export type ArgsBase = {
      /** Artifact input. */
      readonly artifact: Artifact;
      /**
       * Nonempty identifier copied to `build.sign.key` only during canonical
       * descriptor write-back. Not emitted in the signature sidecar.
       */
      readonly identityRef?: string;
      /** Accepted but unused by this driver; not emitted in the signature sidecar. */
      readonly metadata?: Readonly<O>;
      /** Controls manifest descriptor write-back before signing; no rollback on later failure. */
      readonly writeBack?: WriteBack;
    };

    /** Arguments for detached signing. */
    export type ArgsSign = ArgsBase & {
      readonly mode: 'sign';
      readonly signature: Signature;
      /** Ed25519 private key with signing usage. */
      readonly privateKey: CryptoKey;
    };

    /** Arguments for detached verification. */
    export type ArgsVerify = ArgsBase & {
      readonly mode: 'verify';
      readonly signature: Signature;
      /** Caller-trusted Ed25519 public key with verification usage. */
      readonly publicKey: CryptoKey;
    };

    /** Sign, write the sidecar, then verify the in-memory signature, not a sidecar readback. */
    export type ArgsSignVerify = ArgsBase & {
      readonly mode: 'sign-verify';
      readonly signature: Signature;
      /** Ed25519 private key with signing usage. */
      readonly privateKey: CryptoKey;
      /** Caller-trusted Ed25519 public key with verification usage. */
      readonly publicKey: CryptoKey;
    };
  }

  /** Manifest kinds supported by the dist signer. */
  export type ManifestKind = 'dist.json' | 'manifest';
  /** Detached signature scheme used by the dist signer. */
  export type SignScheme = 'Ed25519';
  /** Write-back controls for canonical `dist.json` updates. */
  export type WriteBack = {
    /**
     * Write the detached signature descriptor into canonical `dist.json`
     * (`build.sign`) before signature generation, so the descriptor is signed too.
     * A later signing, sidecar-write or verification failure does not roll back
     * the manifest update.
     *
     * Default behavior:
     * - `true` for `artifact.kind === 'dist.json'` in `sign` / `sign-verify`
     * - ignored when `artifact.kind` is omitted or is `manifest`
     * - ignored for `verify`
     */
    readonly distSignDescriptor?: boolean;
  };

  /** Artifact input for detached sign or verify operations. */
  export type Artifact = {
    /** Manifest file to sign or verify. */
    readonly path: t.StringPath;
    /**
     * Select `dist.json` explicitly to sign/verify the canonical whole document
     * and enable descriptor write-back rules. Omitted or `manifest` signs/verifies
     * exact file bytes, even for a file named `dist.json`.
     * Canonical signing tolerates formatting/key-order changes, but descriptive
     * value changes invalidate the signature even when the content pin is unchanged.
     * Raw signing is sensitive to formatting too. Use the same kind for verification.
     * DistSigner never verifies referenced payload files.
     */
    readonly kind?: ManifestKind;
  };

  /** Detached signature sidecar input. */
  export type Signature = {
    /**
     * File path for raw Ed25519 signature bytes, without a metadata envelope.
     * Keep unlisted sidecars outside a strictly verified payload root:
     * `build.sign` does not exempt them from `assertExactTree`.
     */
    readonly path: t.StringPath;
  };
}
