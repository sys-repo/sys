import { Err, Is, type t } from './common.ts';

export function unsupportedRef(method: 'bytes' | 'text', ref: t.Files.ContentRef): Error {
  return fail(
    'FilesContentRefError.Unsupported',
    `Files.ContentRef.${method}: unsupported content ref kind "${ref.kind}" for "${ref.path}".`,
  );
}

export function fetchUnavailable(path: t.Files.String.Path): Error {
  return fail(
    'FilesContentRefError.FetchUnavailable',
    `Files.ContentRef.bytes: fetch unavailable for "${path}"; pass options.fetch.`,
  );
}

export function fetchFailed(path: t.Files.String.Path, cause: unknown): Error {
  return fail(
    'FilesContentRefError.FetchFailed',
    `Files.ContentRef.bytes: failed to fetch "${path}".`,
    cause,
  );
}

export function httpFailure(path: t.Files.String.Path, response: Response): Error {
  return fail(
    'FilesContentRefError.HttpFailure',
    `Files.ContentRef.bytes: HTTP ${statusLine(response)} for "${path}".`,
  );
}

export function sizeMismatch(
  path: t.Files.String.Path,
  expected: t.NumberBytes,
  actual: t.NumberBytes,
): Error {
  const message =
    `Files.ContentRef.bytes: size mismatch for "${path}"; expected ${expected} bytes, ` +
    `got ${actual} bytes.`;
  return fail('FilesContentRefError.SizeMismatch', message);
}

export function hashMismatch(
  path: t.Files.String.Path,
  expected: t.StringHash,
  actual: t.StringHash,
): Error {
  return fail(
    'FilesContentRefError.HashMismatch',
    `Files.ContentRef.bytes: hash mismatch for "${path}"; expected ${expected}, got ${actual}.`,
  );
}

export function hashUnsupported(
  path: t.Files.String.Path,
  expected: t.StringHash,
  algorithm: string,
): Error {
  const label = Is.blank(algorithm) ? 'unknown' : algorithm;
  return fail(
    'FilesContentRefError.HashUnsupported',
    `Files.ContentRef.bytes: unsupported hash algorithm "${label}" for "${path}" (${expected}).`,
  );
}

export function unsupportedEncoding(path: t.Files.String.Path, encoding: string): Error {
  return fail(
    'FilesContentRefError.UnsupportedEncoding',
    `Files.ContentRef.text: unsupported text encoding "${encoding}" for "${path}".`,
  );
}

export function decodeFailed(path: t.Files.String.Path, cause: unknown): Error {
  return fail(
    'FilesContentRefError.DecodeFailed',
    `Files.ContentRef.text: failed to decode "${path}".`,
    cause,
  );
}

/**
 * Helpers:
 */
function statusLine(response: Response): string {
  const status = String(response.status);
  const statusText = response.statusText;
  return Is.blank(statusText) ? status : `${status} ${statusText}`;
}

function fail(kind: t.Files.ContentRef.Error.Kind, message: string, cause?: unknown): Error {
  const error = cause === undefined
    ? Err.std(message, { name: kind })
    : Err.std(message, { name: kind, cause });
  return Err.normalize(error);
}
