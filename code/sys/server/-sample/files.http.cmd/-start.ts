import { SampleFiles } from './-config.ts';
import {
  Cli,
  Files,
  FilesServer,
  FilesStatic,
  Fs,
  HttpCmd,
  HttpServer,
  Pkg,
  Str,
  type t,
} from './common.ts';

const runtime = await prepareRuntime();

try {
  const files = FilesStatic.fromDist({
    dist: runtime.dist,
    policy: SampleFiles.policy,
  });
  const capabilities = activeCapabilities(files.capabilities);

  const manifest = FilesServer.Http.manifest({ files, path: SampleFiles.path });
  if (!manifest) throw new Error('Expected sample Files backing to support manifest projection.');

  const app = HttpServer.create({ static: false });

  app.get(SampleFiles.path, (c) => {
    const url = sampleUrl(SampleFiles.path);
    const manifestUrl = sampleUrl(manifest.path);
    return c.text(Str.dedent(`
      👋 Files<T>

      GET  ${manifestUrl}
           Files manifest JSON.

      POST ${url}
           Unary Cmd<T> JSON endpoint.

      Capabilities:
      - ${capabilities.join('\n      - ')}

      This sample generates a runtime dist.json before startup.
      File reads return content refs carrying static dist hash/size metadata.

      ---

      curl -s ${url} \\
        -H 'content-type: application/json' \\
        -d '{"kind":"cmd","id":"req-curl","ns":"${Files.Cmd.ns}","name":"${Files.Cmd.Name.read}","payload":{"path":"hello.txt"}}'
    `));
  });

  app.get(manifest.path, (c) => manifest.response(c.req.raw));

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
      kind: 'files:http:cmd',
      urlPaths: [
        { path: SampleFiles.path, label: 'files:http:cmd' },
        { path: manifest.path, label: manifest.label },
      ],
      details: [
        { label: 'files.kind', value: files.kind },
        { label: 'files.transport', value: 'http.cmd:unary' },
        { label: 'files.capabilities', value: capabilities.join(', ') },
        {
          label: 'dist',
          value: Cli.Fmt.Path.tty(runtime.distPath, {
            reserve: 28,
            min: 32,
            highlightBasename: false,
          }),
        },
      ],
    },
  });

  await server.finished;
} finally {
  await Fs.remove(runtime.root);
}

function activeCapabilities(
  capabilities: t.Files.Capabilities,
): readonly t.Files.Capability[] {
  const order: readonly t.Files.Capability[] = [
    'list',
    'stat',
    'read',
    'write',
    'remove',
    'watch',
    'manifest',
  ];
  return order.filter((name) => capabilities[name]);
}

function sampleUrl(path: string): string {
  return `http://localhost:${SampleFiles.port}${path}`;
}

async function prepareRuntime() {
  const temp = await Fs.makeTempDir({ prefix: 'sys-server-files-http-cmd-' });
  const root = temp.absolute;
  try {
    await Fs.copyDir(SampleFiles.root, root, { force: true, throw: true });
    const computed = await Pkg.Dist.compute({ dir: root, save: true });
    if (computed.error) throw computed.error;
    return {
      root,
      dist: computed.dist,
      distPath: Fs.join(root, 'dist.json'),
    } as const;
  } catch (error) {
    await Fs.remove(root);
    throw error;
  }
}
