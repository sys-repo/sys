import { SampleFiles } from './-config.ts';
import { c, Cli, Files, FilesFs, FilesServer, Fs, HttpServer, type t } from './common.ts';

const files = FilesFs.Readonly.live({
  fs: Fs.Capability.Files.Readonly.live(Fs), // ← capability narrows host FS authority to `readonly + watch`.
  root: SampleFiles.root,
  policy: SampleFiles.policy,
});

const server = FilesServer.WebSocket.create({
  port: SampleFiles.port,
  path: SampleFiles.path,
  files,
  status: {
    name: SampleFiles.name,
    root: SampleFiles.root,
    details: SampleFiles.details,
  },
});

printStarted(server);
Deno.addSignalListener('SIGINT', () => void server.close('SIGINT'));
Deno.addSignalListener('SIGTERM', () => void server.close('SIGTERM'));

void HttpServer.keyboard({
  port: server.port,
  url: server.origin,
  print: false,
  exit: true,
  dispose: async () => void await server.close('keyboard'),
});

await server.finished;

/**
 * Helpers:
 */
function printStarted(server: t.WebSocketServer.Started) {
  const status = server.status();
  const table = Cli.table([]);
  table.push([c.gray('server'), c.white(status.name ?? SampleFiles.name)]);
  table.push([c.gray('url'), c.cyan(server.url)]);
  table.push([c.gray('namespace'), c.dim(Files.Cmd.ns)]);
  table.push([c.gray('root'), c.dim(Fs.trimCwd(SampleFiles.root))]);
  table.push([c.dim(c.gray('quit')), c.dim(c.gray('Ctrl+C or Q'))]);
  console.info(`${table}\n`);
}
