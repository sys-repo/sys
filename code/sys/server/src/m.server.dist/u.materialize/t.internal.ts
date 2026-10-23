import type { t } from './common.ts';

export type * from '../../common/t.ts';

/** Sanitized transport refusal; no lower error object crosses this boundary. */
export type ManifestFetchFailure = Readonly<{ ok: false; reason: t.Dist.FailureReason }>;

/** Admitted transport observation, not authenticated manifest content. */
export type ManifestResponse =
  | ManifestFetchFailure
  | Readonly<{
    ok: true;
    data: Blob;
    requestedUrl: t.StringUrl;
    finalUrl: t.StringUrl;
  }>;
