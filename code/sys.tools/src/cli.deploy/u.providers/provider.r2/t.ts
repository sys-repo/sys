import type { t } from '../common.ts';

/**
 * R2 provider configuration (YAML configuration).
 */
export type R2Provider = {
  kind: 'r2';

  /** Cloudflare account id that owns the R2 bucket. */
  accountId: string;

  /** R2 bucket name. */
  bucket: string;

  /** Required object namespace prefix for this deploy target. */
  prefix: string;

  /** Optional public read origin used by remote dist.json checks/content refs. */
  readOrigin?: t.StringUrl;

  /** R2 HTTP access credentials. */
  credentials: {
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
    readonly sessionToken?: string;
  };
};
