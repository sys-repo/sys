import { Cell } from '@sys/cell';
import { Files } from '@sys/model/files';
import { FilesWebSocketService } from '@sys/server/files/service';
import { describe, expect, Fs, it, Path, Testing, type t } from '../-test.ts';
import { ShellStructure } from '../m.shell.structure/mod.ts';

const ROOT = Path.resolve(import.meta.dirname ?? '.', '../..') as t.StringDir;
const SAMPLE_ROOT = './-sample/app';
const SAMPLE_FILE = 'shell.yaml';
const CELL_CONFIG = Fs.join(ROOT, '-config/@sys.cell/cell.yaml');
const SERVICE_CONFIG = Fs.join(ROOT, '-config/@sys.server.files/shell.yaml');

describe('draft shell Files websocket service', () => {
  it('declares shell:files in Cell config', async () => {
    const cell = await readText(CELL_CONFIG);
    const service = await readText(SERVICE_CONFIG);

    expect(cell).to.contain('name: shell:files');
    expect(cell).to.contain('use: FilesWebSocketService');
    expect(cell).to.contain("from: 'jsr:@sys/server/files/service'");
    expect(cell).to.contain('config: ./-config/@sys.server.files/shell.yaml');

    expect(service).to.contain('name: shell:files');
    expect(service).to.contain(`root: ${SAMPLE_ROOT}`);
    expect(service).to.contain('path: /files');
    expect(service).to.contain('watch: true');
    expect(service).to.contain("policy: '**'");

    const plan = await Cell.Services.plan(await Cell.load(ROOT), { mode: 'dev' });
    const files = plan.services.find((service) => service.service.name === 'shell:files');
    expect(files?.service.use).to.eql('FilesWebSocketService');
    expect(files?.service.from).to.eql('jsr:@sys/server/files/service');
    expect(files?.paths.config).to.eql(SERVICE_CONFIG);
  });

  it('serves the shell sample over Files websocket into ShellStructure', async () => {
    const dir = await Testing.dir('draft.shell.files.websocket');
    const config = Fs.join(dir.dir, 'shell.files.yaml') as t.StringPath;
    await Fs.write(config, serviceConfig({ port: 0 }));

    const server = await FilesWebSocketService.start({
      cwd: ROOT,
      paths: { config },
      silent: true,
    });

    try {
      const status = server.status();
      expect(status.name).to.eql('shell:files');
      expect(status.kind).to.eql('files:websocket');
      expect(status.root).to.eql(Fs.join(ROOT, '-sample/app'));

      const client = await Files.Client.websocket(server.url);
      try {
        const read = await client.send(Files.Cmd.Name.read, { path: SAMPLE_FILE });
        expect(read.kind).to.eql('inline');
        if (read.kind !== 'inline') throw new Error('Expected inline Files<T> read result.');

        const structure = ShellStructure.parse(read.content);
        const resolved = ShellStructure.resolve(structure);

        expect(structure).to.eql({
          kind: 'shell.structure',
          version: 1,
          name: 'Sample Shell',
        });
        expect(resolved).to.eql(structure);
      } finally {
        await client.close('test.cleanup');
      }
    } finally {
      await server.close('test.cleanup');
    }
  });
});

async function readText(path: t.StringPath): Promise<string> {
  const read = await Fs.readText(path);
  if (!read.ok) throw new Error(`Failed to read: ${path}`);
  return read.data ?? '';
}

function serviceConfig(options: { readonly port: number }): string {
  return [
    'name: shell:files',
    `root: ${SAMPLE_ROOT}`,
    'path: /files',
    `port: ${options.port}`,
    'watch: true',
    "policy: '**'",
    '',
  ].join('\n');
}
