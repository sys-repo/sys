import { Cell } from '@sys/cell';
import { Files } from '@sys/model/files/fs';
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

describe('draft shell sample through Files client', () => {
  it('composes draft:files through Cell planning', async () => {
    const service = await plannedShellFilesService();

    expect(service?.service.use).to.eql('FilesWebSocketService');
    expect(service?.service.from).to.eql('jsr:@sys/server/files/service');
    expect(service?.paths.config).to.eql(SERVICE_CONFIG);
  });

  it('reads the checked-in shell sample through local and websocket Files client', async () => {
    const config = await readCheckedInServiceConfig();
    expect(config).to.contain('port: 5050');

    const localYaml = await readSampleYamlThroughLocalFilesClient();
    const websocketYaml = await readSampleYamlOverWebSocket(config);
    expect(websocketYaml).to.eql(localYaml);

    const structure = ShellStructure.parse(localYaml);
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
  return plan.services.find((service) => service.service.name === 'draft:files');
}

async function readCheckedInServiceConfig(): Promise<string> {
  const config = await readText(SERVICE_CONFIG);
  expect(config).to.contain('name: draft:files');
  expect(config).to.contain(`root: ${SAMPLE_ROOT}`);
  expect(config).to.contain('path: /files');
  expect(config).to.contain('watch: true');
  expect(config).to.contain("policy: '**'");
  return config;
}

async function readSampleYamlThroughLocalFilesClient(): Promise<string> {
  const backing = Files.Fs.Readonly.create({
    fs: Fs.Capability.Files.Readonly.create(Fs),
    root: Fs.join(ROOT, '-sample/app'),
    policy: Files.Policy.readonly(SAMPLE_FILE),
  });
  const files = Files.Client.local(backing);

  try {
    return await files.readText(SAMPLE_FILE);
  } finally {
    files.dispose('test.cleanup');
  }
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
      return await client.readText(SAMPLE_FILE);
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
