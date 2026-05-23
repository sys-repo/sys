import { Err, type t } from '../common.ts';

export function openError(href: t.StringUrl, cause: unknown): Error {
  return Err.normalize(
    Err.std(`Files.Client.websocket: failed to open ${href}`, {
      name,
      cause,
    }),
  );
}

export function readTextError(path: t.Files.String.Path, cause: unknown): Error {
  return Err.normalize(
    Err.std(`Files.Client.readText: failed to read "${path}"`, {
      name,
      cause,
    }),
  );
}

export function contentRefUnavailable(path: t.Files.String.Path): Error {
  return Err.normalize(
    Err.std(
      `Files.Client.readText: inline text unavailable for "${path}"; backing returned contentRef.`,
      { name },
    ),
  );
}

export function truncatedRead(path: t.Files.String.Path): Error {
  return Err.normalize(
    Err.std(
      `Files.Client.readText: truncated read for "${path}"; pass maxBytes to accept bounded content.`,
      { name },
    ),
  );
}

/**
 * Helpers:
 */
const name = 'FilesClientError';
