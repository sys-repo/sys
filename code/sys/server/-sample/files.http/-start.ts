import { SampleFiles } from './-config.ts';
import { Files, Fs, HttpCmd, HttpServer } from './common.ts';

const files = Files.Fs.Readonly.create({
  fs: Fs.Capability.Files.Readonly.create(Fs),
  root: SampleFiles.root,
  policy: SampleFiles.policy,
});

const app = HttpServer.create({ static: false });

app.post(SampleFiles.path, (c) => {
  return HttpCmd.handle(c.req.raw, {
    path: SampleFiles.path,
    cmd: { ns: Files.Cmd.ns, handlers: files.handlers },
  });
});

const server = HttpServer.start(app, {
  hostname: '127.0.0.1',
  port: SampleFiles.port,
  name: SampleFiles.name,
  keyboard: true,
  status: {
    kind: 'files:http',
    urlPaths: [{ path: SampleFiles.path, label: 'files:http' }],
    details: [
      { label: 'files.kind', value: files.kind },
      { label: 'files.transport', value: 'http.cmd:unary' },
      { label: 'files.capabilities', value: 'list,stat,read,manifest' },
    ],
  },
});

await server.finished;
