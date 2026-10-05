import { SampleFiles } from './-config.ts';
import { HttpStatic } from './common.ts';

const server = await HttpStatic.start({
  dir: SampleFiles.root,
  hostname: '127.0.0.1',
  port: SampleFiles.port,
  name: SampleFiles.name,
  info: { dist: SampleFiles.paths.dist },
  keyboard: true,
});

await server.finished;
