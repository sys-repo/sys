import { Files, type t } from '../../common.ts';

export async function readManifest(
  request: Request,
  files: t.FilesServer.Backing,
): Promise<t.Files.Manifest> {
  const controller = new AbortController();
  const abort = () => controller.abort(request.signal.reason ?? 'request-abort');
  if (request.signal.aborted) abort();
  else request.signal.addEventListener('abort', abort, { once: true });

  try {
    const name = Files.Cmd.Name.manifest;
    const context: t.Cmd.Handler.Context<
      t.Files.Cmd.Name,
      t.Files.Cmd.Event,
      typeof name
    > = {
      id: 'req-files-manifest-http' as t.Cmd.ReqId,
      name,
      ns: Files.Cmd.ns,
      signal: controller.signal,
      emit() {
        // The HTTP manifest projection is unary; manifest emits no events.
      },
    };

    return await files.handlers[name]({}, context);
  } finally {
    request.signal.removeEventListener('abort', abort);
  }
}
