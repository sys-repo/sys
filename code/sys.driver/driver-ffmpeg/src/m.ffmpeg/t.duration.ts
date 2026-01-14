import type { t } from './common.ts';

/**
 * Return the total duration of a media file in milliseconds.
 *
 * Uses `ffprobe` to query container-level duration metadata.
 * Supports common video containers such as `.webm` and `.mp4`.
 *
 * - Pure probe: does not modify the file
 * - Container-agnostic (no codec assumptions)
 * - Rounds to whole milliseconds
 *
 * @returns A result object indicating success with `msecs`, or failure with a reason
 */
export type MediaDurationFn = (
  path: t.StringPath,
  opts?: MediaDurationOptions,
) => Promise<t.MediaDurationResult>;

export type MediaDurationOptions = {
  /** Optional override for ffprobe binary (default: "ffprobe"). */
  readonly bin?: {
    readonly ffprobe?: string;
  };
};

export type MediaDurationResult =
  | { readonly ok: true; readonly msecs: t.Msecs }
  | { readonly ok: false; readonly reason: MediaDurationFailReason; readonly error?: unknown };

export type MediaDurationFailReason =
  | 'missing-ffprobe'
  | 'unsupported-format'
  | 'probe-failed'
  | 'parse-failed';
