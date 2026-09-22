import type { t } from './common.ts';

/** A separately published audience, not a separate application. */
export type Audience = 'private' | 'public';
export type Target = { readonly bucket: string; readonly prefix: string };
export type CredentialNames = { readonly accessKeyId: string; readonly secretAccessKey: string };

/** Two storage targets, browser URL mapping, and credentials named by operation. */
export type Config = {
  readonly accountId: string;
  readonly targets: Readonly<Record<Audience, Target>>;
  readonly publicAssetBase: string;
  readonly credentials: {
    readonly serve: CredentialNames;
    readonly pushPrivate: CredentialNames;
    readonly pushPublic: CredentialNames;
  };
  readonly limits: Readonly<t.R2.ReadRoute.Limits>;
};

/** One build's two exact manifests and the public base embedded in its bytes. */
export type Selection = {
  readonly private: t.DistPin;
  readonly public: t.DistPin;
  readonly publicAssetBase: string;
};

/** Credential lookup shared by dotenv readers and the hosted process environment. */
export type EnvReader = Pick<typeof Deno.env, 'get'>;

/** Captured configuration and build identity for one application instance. */
export type AppInputs = {
  readonly config: Config;
  readonly selection: Selection;
};

/** Application inputs; the signing bucket is the storage test seam. */
export type AppOptions = AppInputs & {
  readonly bucket: Pick<t.R2.Bucket, 'name' | 'presignGet'>;
  readonly signal?: AbortSignal;
};
