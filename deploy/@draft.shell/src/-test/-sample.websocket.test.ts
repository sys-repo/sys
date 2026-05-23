import { Cell } from '@sys/cell';
import { Files } from '@sys/model/files';
import { FilesWebSocketService } from '@sys/server/files/service';
import { describe, expect, Fs, it, Path, type t, Testing } from '../-test.ts';
import { ShellStructure } from '../m.shell.structure/mod.ts';

const ROOT = Path.resolve(import.meta.dirname ?? '.', '../..');
const SAMPLE_FILE = 'shell.yaml';
const SAMPLE_ROOT = './-sample/app';
const SERVICE_CONFIG = Fs.join(ROOT, '-config/@sys.server.files/shell.yaml');
const EXPECTED = {
  kind: 'shell.structure',
  version: 1,
  name: 'Sample Shell',
} as const;

describe('draft shell sample over Files websocket', () => {
  it('composes sample:files through Cell planning', async () => {
    const service = await plannedShellFilesService();

    expect(service?.service.use).to.eql('FilesWebSocketService');
    expect(service?.service.from).to.eql('jsr:@sys/server/files/service');
    expect(service?.paths.config).to.eql(SERVICE_CONFIG);
  });

  it('reads the checked-in shell sample over websocket into ShellStructure', async () => {
    const config = await readCheckedInServiceConfig();
    expect(config).to.contain('port: 5050');

    const yaml = await readSampleYamlOverWebSocket(config);
    const structure = ShellStructure.parse(yaml);
    const resolved = ShellStructure.resolve(structure);

    expect(structure).to.eql(EXPECTED);
    expect(resolved).to.eql(EXPECTED);
  });
});

/**
 * Helpers:
 */

async function plannedShellFilesService() {
  const cell = await Cell.load(ROOT);
  const plan = await Cell.Services.plan(cell, { mode: 'dev' });
  return plan.services.find((service) => service.service.name === 'sample:files');
}

async function readCheckedInServiceConfig(): Promise<string> {
  const config = await readText(SERVICE_CONFIG);
  expect(config).to.contain('name: sample:files');
  expect(config).to.contain(`root: ${SAMPLE_ROOT}`);
  expect(config).to.contain('path: /files');
  expect(config).to.contain('watch: true');
  expect(config).to.contain("policy: '**'");
  return config;
}

async function readSampleYamlOverWebSocket(serviceConfig: string): Promise<string> {
  const dir = await Testing.dir('draft.shell.files.websocket');
  const runtimeConfig = Fs.join(dir.dir, 'shell.files.yaml') as t.StringPath;
  await Fs.write(runtimeConfig, withEphemeralPort(serviceConfig));
  const server = await FilesWebSocketService.start({
    cwd: ROOT,
    paths: { config: runtimeConfig },
    silent: true,
  });

  try {
    expect(server.status().root).to.eql(Fs.join(ROOT, '-sample/app'));
    const client = await Files.Client.websocket(server.url);
    try {
      const read = await client.send(Files.Cmd.Name.read, { path: SAMPLE_FILE });
      if (read.kind !== 'inline') throw new Error('Expected inline Files<T> read result.');
      return read.content;
    } finally {
      await client.close('test.cleanup');
    }
  } finally {
    await server.close('test.cleanup');
  }
}

async function readText(path: t.StringPath): Promise<string> {
  const read = await Fs.readText(path);
  if (!read.ok) throw new Error(`Failed to read: ${path}`);
  return read.data ?? '';
}

function withEphemeralPort(config: string): string {
  const next = config.replace(/^port:\s*\d+\s*$/m, 'port: 0');
  if (next === config) throw new Error('Expected service config to declare a fixed port.');
  return next;
}
