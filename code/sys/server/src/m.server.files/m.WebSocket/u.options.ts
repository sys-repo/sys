import { D, Files, Is, type t } from '../common.ts';
import { Http } from '../m.Http/mod.ts';

/**
 * Convert Files/WebSocket facade options to the underlying typed WebSocket server options.
 */
export function toWebSocketOptions(
  options: t.FilesServer.WebSocket.StartOptions,
): t.WebSocketServer.StartOptions<
  t.Files.Cmd.Name,
  t.Files.Cmd.Payload,
  t.Files.Cmd.Result,
  t.Files.Cmd.Event
> {
  const { files, status, ...server } = options;
  const path = server.path ?? D.path;
  const manifest = Http.manifest({ files, path });

  return {
    ...server,
    path,
    cmd: { ns: Files.Cmd.ns, handlers: files.handlers },
    ...(manifest === undefined ? {} : { http: httpOptions(manifest) }),
    status: statusOptions(files, status),
  };
}

/**
 * Helpers:
 */
function httpOptions(
  manifest: t.FilesServer.Http.ManifestProjection,
): t.WebSocketServer.HttpOptions {
  return {
    handle: (request) => manifest.matches(request) ? manifest.response(request) : undefined,
    urls: [{ path: manifest.path, label: manifest.label }],
  };
}

function statusOptions(
  files: t.FilesServer.Backing,
  status: t.FilesServer.WebSocket.StatusOptions | undefined,
): t.WebSocketServer.StatusOptions {
  const input = status ?? {};
  const details = [...filesDetails(files), ...(input.details ?? [])];

  return {
    ...input,
    kind: input.kind ?? D.status.kind,
    urlLabel: input.urlLabel ?? D.status.urlLabel,
    ...(details.length === 0 ? {} : { details }),
  };
}

function filesDetails(files: t.FilesServer.Backing): readonly t.Service.Detail[] {
  const details: t.Service.Detail[] = [];
  const kind = files.kind;
  const capabilities = activeCapabilities(files.capabilities);

  if (Is.str(kind) && kind.length > 0) details.push({ label: 'files.kind', value: kind });
  if (capabilities.length > 0) {
    details.push({ label: 'files.capabilities', value: capabilities.join(', ') });
  }

  return details;
}

function activeCapabilities(
  capabilities: t.Files.Capabilities,
): readonly t.Files.Capability[] {
  return D.capabilities.filter((name) => capabilities[name]);
}
