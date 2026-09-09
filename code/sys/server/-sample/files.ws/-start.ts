import { SampleFiles } from './-config.ts';
import { Files, FilesServer, Fs } from './common.ts';

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
  keyboard: true,
  status: { name: SampleFiles.name, root: SampleFiles.root },
});

await server.finished;
