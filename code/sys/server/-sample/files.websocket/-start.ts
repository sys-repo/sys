import { SampleFiles } from './-config.ts';
import { Files, FilesServer, Fs, HttpServer } from './common.ts';

const files = Files.Fs.Readonly.live({
  fs: Fs.Capability.Files.Readonly.live(Fs), // ← capability narrows host FS authority to `readonly + watch`.
  root: SampleFiles.root,
  policy: SampleFiles.policy,
});

const server = FilesServer.WebSocket.start({
  port: SampleFiles.port,
  path: SampleFiles.path,
  files,
  lifecycle: 'process',
  status: {
    name: SampleFiles.name,
    root: SampleFiles.root,
  },
});

void HttpServer.keyboard({
  port: server.port,
  url: server.origin,
  print: false,
  exit: true,
  dispose: async () => void await server.close('keyboard'),
});

await server.finished;
