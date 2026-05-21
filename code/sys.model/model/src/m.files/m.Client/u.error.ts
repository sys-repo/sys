import { Err, type t } from '../common.ts';

export function openError(href: t.StringUrl, cause: unknown): Error {
  return Err.normalize(
    Err.std(`Files.Client.websocket: failed to open ${href}`, {
      name: 'FilesClientError',
      cause,
    }),
  );
}
