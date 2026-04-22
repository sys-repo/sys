import { describe, expect, Fs, it, Process, ROOT, SAMPLE } from '../../-test.ts';

describe('Vite published external minimal-crutch world', () => {
  it('fixture stages an external pure-JSR driver world without local-source alias privilege', async () => {
    const config = (await Fs.readText(`${SAMPLE.Dirs.samplePublishedBaseline}/vite.config.ts`)).data ?? '';
    const imports = (
      await Fs.readJson<{ imports?: Record<string, string> }>(
        `${SAMPLE.Dirs.samplePublishedBaseline}/imports.json`,
      )
    ).data?.imports ?? {};

    expect(config).to.include(`from 'jsr:@sys/driver-vite@0.0.368'`);
    expect(imports['@sys/http/client']).to.eql('jsr:@sys/http@0.0.260/client');
    expect(Object.keys(imports).includes('@sys/driver-vite')).to.eql(false);
    expect(Object.values(imports).some((value) => value.startsWith('file:'))).to.eql(false);
  });

  it('build: current external pure-JSR world fails honestly instead of falling forward to local-source alias privilege', async () => {
    const res = await Process.invoke({
      cmd: 'deno',
      args: [
        'eval',
        '--node-modules-dir=auto',
        BUILD_PROBE_SOURCE,
      ],
      cwd: ROOT.resolve('code/sys.driver/driver-vite'),
      silent: true,
    });

    expect(res.success).to.eql(true);
    const data = parseProbeJson<{
      ok: boolean;
      stderr: string;
      stdout: string;
    }>(res.text.stdout);
    expect(data.ok).to.eql(false);
    expectPublishedBoundaryFailure(`${data.stderr}\n${data.stdout}`);
  });

  it('dev: external pure-JSR world serves transformed entry without local-source alias privilege', async () => {
    const res = await Process.invoke({
      cmd: 'deno',
      args: [
        'eval',
        '--node-modules-dir=auto',
        DEV_PROBE_SOURCE,
      ],
      cwd: ROOT.resolve('code/sys.driver/driver-vite'),
      silent: true,
    });

    expect(res.success).to.eql(true);
    const data = parseProbeJson<{
      ok: boolean;
      htmlStatus: number;
      entryStatus: number;
      entryText: string;
    }>(res.text.stdout);
    expect(data.ok).to.eql(true);
    expect(data.htmlStatus).to.eql(200);
    expect(data.entryStatus).to.eql(200);
    expect(data.entryText).to.include('sample-bridge');
    expect(data.entryText).to.include('sample-bridge-http');
    expect(data.entryText.includes('.vite.bootstrap.')).to.eql(false);
    expect(data.entryText.includes('#module-sync-enabled')).to.eql(false);
  });
});

const BUILD_PROBE_SOURCE = `
  import { buildSample } from './src/m.vite/-test.external/u.fixture.build.ts';
  import { SAMPLE } from './src/-test.ts';

  const res = await buildSample({
    sampleName: 'Vite.published.minimal-crutch.build.probe',
    sampleDir: SAMPLE.Dirs.samplePublishedBaseline,
  });
  console.log(JSON.stringify({
    ok: res.build.ok,
    stderr: res.build.cmd.output.text.stderr,
    stdout: res.build.cmd.output.text.stdout,
  }));
`;

const DEV_PROBE_SOURCE = `
  import { devSample } from './src/m.vite/-test.external/u.fixture.dev.ts';
  import { SAMPLE } from './src/-test.ts';

  const res = await devSample({
    sampleName: 'Vite.published.minimal-crutch.dev.probe',
    sampleDir: SAMPLE.Dirs.samplePublishedBaseline,
  });
  try {
    console.log(JSON.stringify({
      ok: true,
      htmlStatus: res.html.status,
      entryStatus: res.entry.status,
      entryText: res.entry.text,
    }));
  } finally {
    await res.dev.dispose();
  }
`;

function parseProbeJson<T>(stdout: string): T {
  const lines = stdout.trim().split('\n').filter(Boolean);
  const line = lines.at(-1) ?? '{}';
  return JSON.parse(line) as T;
}

function expectPublishedBoundaryFailure(text: string) {
  const normalized = text.replace(/\u001b\[[0-9;]*m/g, '');
  const markers = [
    'jsr:@sys/driver-vite@0.0.368',
    'https://jsr.io/@sys/driver-vite/',
    'Could not resolve',
    "reading 'unref'",
  ];
  expect(markers.some((marker) => normalized.includes(marker))).to.eql(true);
}
