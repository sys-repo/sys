import type { t } from './common.ts';

/** The private HTML shell or public frontend assets. */
export type Audience = 'private' | 'public';
export type Target = { readonly bucket: string; readonly prefix: string };
export type CredentialNames = { readonly accessKeyId: string; readonly secretAccessKey: string };

/** Bucket locations, public asset URL, and credential variable names. */
export type Config = {
  readonly accountId: string;
  readonly targets: Readonly<Record<Audience, Target>>;
  readonly publicAssetBase: string;
  readonly credentials: {
    readonly serve: CredentialNames;
    readonly pushPrivate: CredentialNames;
    readonly pushPublic: CredentialNames;
  };
};

/** Shared content pins, original payload size, and recorded build base. */
export type BuildRecord = {
  readonly publicAssetBase: string;
  /** Original admitted payload total in bytes, before private/public projection. */
  readonly bundleSize: number;
  readonly selection: t.DistPins<Audience>;
};

/** Verified audience with a captured pin and document-stable recheck; callers own refusal policy. */
export type BuildSelection =
  | t.FsPkg.Dist.Pinned.Verify.Failure
  | (t.FsPkg.Dist.Pinned.Verify.Verified & {
    readonly files: readonly string[];
    readonly dir: t.StringDir;
    readonly verify: () => Promise<t.FsPkg.Dist.Pinned.Verify.Result>;
  });

/** Credential lookup shared by dotenv readers and the hosted process environment. */
export type EnvReader = Pick<typeof Deno.env, 'get'>;

/** Configuration and build record for one application instance. */
export type AppInputs = {
  readonly config: Config;
  readonly buildRecord: BuildRecord;
};
