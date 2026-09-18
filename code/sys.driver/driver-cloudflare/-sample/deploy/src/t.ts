import type { t } from './common.ts';

/** R2 target, credential environment-variable names and fixed read budgets. */
export type Config = {
  readonly accountId: string;
  readonly bucket: string;
  readonly prefix: string;
  readonly credentials: { readonly accessKeyId: string; readonly secretAccessKey: string };
  readonly limits: Readonly<t.R2.ReadRoute.Limits>;
};

/** Credential lookup shared by dotenv readers and the hosted process environment. */
export type EnvReader = Pick<typeof Deno.env, 'get'>;

/** Captured target and expected manifest identity for one application instance. */
export type AppInputs = {
  readonly config: Config;
  readonly pin: t.DistPin;
};

/** Application inputs; the signing bucket is the storage test seam. */
export type AppOptions = AppInputs & {
  readonly bucket: Pick<t.R2.Bucket, 'name' | 'presignGet'>;
  readonly signal?: AbortSignal;
};
