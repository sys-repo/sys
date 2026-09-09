import { Files, type t } from '../../common.ts';

export async function readManifest(
  files: t.FilesServer.Backing,
  signal: AbortSignal,
): Promise<t.Files.Manifest> {
  const name = Files.Cmd.Name.manifest;
  return files.handlers[name]({}, {
    id: 'req-files-manifest-http' as t.Cmd.ReqId,
    name,
    ns: Files.Cmd.ns,
    signal,
    emit() {
      // The HTTP manifest projection is unary; manifest emits no events.
    },
  });
}
