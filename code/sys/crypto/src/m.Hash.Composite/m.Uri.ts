import { type t } from './common.ts';

/**
 * Helpers for reading/encoding the [FileHashUri] string.
 *
 * Supports URIs of the form:
 *   "<algo>-<hash>"
 *   "<algo>-<hash>:bytes=<total>"
 *
 * where <algo> is "sha1" or "sha256".
 */
export const FileHashUri: t.FileHashUriLib = {
  toUri(hash: string, bytes?: number): t.FileHashUri {
    return (bytes == null ? hash : `${hash}:size=${bytes}`) as t.FileHashUri;
  },

  fromUri(input: string) {
    if (typeof input !== 'string') return { hash: '' };

    // –^ group 1: "sha1-…" or "sha256-…"
    //          group 2: digits after ":size="
    const RE = /^((?:sha1|sha256)-[A-Fa-f0-9]+)(?::size=(\d+))?$/;
    const m = RE.exec(input);
    if (!m) return { hash: '' };

    const [, hash, bytesStr] = m;
    const bytes = bytesStr !== undefined ? parseInt(bytesStr, 10) : undefined;

    return bytes != null ? { hash, bytes } : { hash };
  },
} as const;
