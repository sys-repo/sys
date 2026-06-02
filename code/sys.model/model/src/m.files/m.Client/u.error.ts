import { Err, type t } from '../common.ts';

const name = 'FilesClientError';

/**
 * Build a Files client WebSocket open failure error.
 */
export function openError(href: t.StringUrl, cause: unknown): Error {
  return Err.normalize(
    Err.std(`Files.Client.websocket: failed to open ${href}`, { name, cause }),
  );
}

/**
 * Build a Files client text-read failure error.
 */
export function readTextError(path: t.Files.String.Path, cause: unknown): Error {
  return Err.normalize(
    Err.std(`Files.Client.readText: failed to read "${path}"`, { name, cause }),
  );
}

/**
 * Build a Files client text-write failure error.
 */
export function writeTextError(path: t.Files.String.Path, cause: unknown): Error {
  return Err.normalize(
    Err.std(`Files.Client.writeText: failed to write "${path}"`, { name, cause }),
  );
}

/**
 * Build a Files client bytes-write failure error.
 */
export function writeBytesError(path: t.Files.String.Path, cause: unknown): Error {
  return Err.normalize(
    Err.std(`Files.Client.writeBytes: failed to write "${path}"`, { name, cause }),
  );
}

/**
 * Build a Files client remove failure error.
 */
export function removeError(path: t.Files.String.Path, cause: unknown): Error {
  return Err.normalize(
    Err.std(`Files.Client.remove: failed to remove "${path}"`, { name, cause }),
  );
}

/**
 * Build a Files client readText content-ref rejection error.
 */
export function contentRefUnavailable(path: t.Files.String.Path): Error {
  return Err.normalize(
    Err.std(
      `Files.Client.readText: inline text unavailable for "${path}"; backing returned contentRef.`,
      { name },
    ),
  );
}

/**
 * Build a Files client readText truncation rejection error.
 */
export function truncatedRead(path: t.Files.String.Path): Error {
  return Err.normalize(
    Err.std(
      `Files.Client.readText: truncated read for "${path}"; pass maxBytes to accept bounded content.`,
      { name },
    ),
  );
}
