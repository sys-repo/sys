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

/** Shared manifest pins and the sample's recorded build base. */
export type BuildRecord = {
  readonly publicAssetBase: string;
  readonly selection: t.DistPins<Audience>;
};

/** Verified local audience and its captured recheck; callers own refusal policy. */
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
