import { type t } from './common.ts';

/**
 * Helpers for reading/encoding the [FileHashUri] string.
 *
 * Supports URIs of the form:
 *   "<algo>-<hash>"
 *   "<algo>-<hash>:bytes-<total>"
 *
 * where <algo> is "sha1" or "sha256".
 */
export const FileHashUri: t.FileHashUriLib = {
  toUri(hash: string, bytes?: number): t.FileHashUri {
    let uri = hash;
    if (typeof bytes === 'number') uri += `:bytes-${bytes}`;
    return uri as t.FileHashUri;
  },

  fromUri(input: string) {
    if (typeof input !== 'string') return { hash: '' };

    // –^ capture “sha1-…” or “sha256-…” as group 1
    //                   optional “:bytes-<digits>” in group 2
    const RE = /^((?:sha1|sha256)-[A-Fa-f0-9]+)(?::bytes-(\d+))?$/;
    const m = RE.exec(input);
    if (!m) return { hash: '' };

    const [, hash, bytesStr] = m;
    const bytes = bytesStr !== undefined ? parseInt(bytesStr, 10) : undefined;

    return bytes !== undefined ? { hash, bytes } : { hash };
  },
} as const;

/**
 * URIs:
 */
export const Uri = {
  File: FileHashUri,
} as const;
