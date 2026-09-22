import type { t } from './common.ts';

/** The private HTML shell or public frontend assets. */
export type Audience = 'private' | 'public';
export type Target = { readonly bucket: string; readonly prefix: string };
export type CredentialNames = { readonly accessKeyId: string; readonly secretAccessKey: string };

/** Bucket locations, public asset URL, credential variable names, and response limits. */
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

/** Shared manifest pins and the sample's recorded build base. */
export type BuildRecord = {
  readonly selection: t.DistPins<Audience>;
  readonly publicAssetBase: string;
};

/** Credential lookup shared by dotenv readers and the hosted process environment. */
export type EnvReader = Pick<typeof Deno.env, 'get'>;

/** Configuration and build record for one application instance. */
export type AppInputs = {
  readonly config: Config;
  readonly buildRecord: BuildRecord;
};

/** Application inputs and the bucket used to sign private reads. */
export type AppOptions = AppInputs & {
  readonly bucket: Pick<t.R2.Bucket, 'name' | 'presignGet'>;
  readonly signal?: AbortSignal;
};
