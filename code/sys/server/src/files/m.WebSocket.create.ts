import { D, Files, Is, type t, WebSocketServer } from './common.ts';

/** Start a WebSocket Cmd service for a bounded Files backing. */
export const create: t.FilesServer.WebSocket.Lib['create'] = (options) => {
  const { files, status, ...server } = options;

  return WebSocketServer.create<
    t.Files.Cmd.Name,
    t.Files.Cmd.Payload,
    t.Files.Cmd.Result,
    t.Files.Cmd.Event
  >({
    ...server,
    path: server.path ?? D.path,
    cmd: { ns: Files.Cmd.ns, handlers: files.handlers },
    status: statusOptions(files, status),
  });
};

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
): readonly t.Files.Capability.Name[] {
  return D.capabilities.filter((name) => capabilities[name]);
}
