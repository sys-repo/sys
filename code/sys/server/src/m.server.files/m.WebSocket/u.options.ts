import { D, Files, Is, type t } from '../common.ts';

/** Convert Files/WebSocket facade options to the underlying typed WebSocket server options. */
export function toWebSocketOptions(
  options: t.FilesServer.WebSocket.StartOptions,
): t.WebSocketServer.StartOptions<
  t.FilesCmd.Name,
  t.FilesCmd.Payload,
  t.FilesCmd.Result,
  t.FilesCmd.Event
> {
  const { files, status, ...server } = options;

  return {
    ...server,
    path: server.path ?? D.path,
    cmd: { ns: Files.Cmd.ns, handlers: files.handlers },
    status: statusOptions(files, status),
  };
}

/**
 * Helpers:
 */
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
  const fidelity = files.capabilities.fidelity;
  const capabilities = activeCapabilities(files.capabilities);

  if (Is.str(kind) && kind.length > 0) details.push({ label: 'files.kind', value: kind });
  if (Is.str(fidelity) && fidelity.length > 0) {
    details.push({ label: 'files.fidelity', value: fidelity });
  }
  if (capabilities.length > 0) {
    details.push({ label: 'files.capabilities', value: capabilities.join(',') });
  }

  return details;
}

function activeCapabilities(
  capabilities: t.Files.Capabilities,
): readonly t.FilesCapability.Name[] {
  return D.capabilities.filter((name) => capabilities[name]);
}
