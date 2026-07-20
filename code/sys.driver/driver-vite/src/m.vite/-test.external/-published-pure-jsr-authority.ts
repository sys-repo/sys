import { describe, expect, Fs, it, Json, Process, ROOT, SAMPLE, slug } from '../../-test.ts';
import { DEFAULTS } from '../common.ts';
import { Wrangle } from '../u/u.wrangle.ts';

type BuildProbeJson = {
  ok: boolean;
  stderr: string;
  stdout: string;
  moduleTexts: string[];
};

type DevProbeJson = {
  ok: boolean;
  htmlStatus: number;
  entryStatus: number;
  entryText: string;
  moduleTexts: string[];
};

describe('Vite published external pure-JSR authority world', () => {
  it('fixture stages an external pure-JSR driver world without local-source alias privilege', async () => {
    const config =
      (await Fs.readText(`${SAMPLE.Dirs.samplePublishedBaseline}/vite.config.ts`)).data ?? '';
    const imports = await samplePublishedImports();

    expect(config).to.match(/from 'jsr:@sys\/driver-vite@\d+\.\d+\.\d+'/);
    expect(imports['@sys/http/client']).to.match(/^jsr:@sys\/http@\d+\.\d+\.\d+\/client$/);
    expect(Object.keys(imports).includes('@sys/driver-vite')).to.eql(false);
    expect(Object.values(imports).some((value) => value.startsWith('file:'))).to.eql(false);
  });

  it('startup authority for an external pure-JSR consumer stays consumer-visible and published-boundary honest', async () => {
    const imports = await samplePublishedImports();
    const sample = await externalStartupImportMap('build');

    try {
      expect(sample.path.includes('node_modules/.vite/.sys-driver-vite/startup')).to.eql(true);
      expect(sample.data.scopes).to.eql(undefined);
      expect(sample.data.imports?.['@sys/http/client']).to.eql(imports['@sys/http/client']);
      expect(sample.data.imports?.['@sys/driver-vite']).to.eql(undefined);
      expect(sample.data.imports?.['@sys/http']).to.eql(undefined);
      expect(sample.data.imports?.['#module-sync-enabled']).to.match(
        /^file:.*module-sync-enabled\.mjs$/,
      );
      const nonStartupFiles = Object.entries(sample.data.imports ?? {})
        .filter(([key, value]) => key !== '#module-sync-enabled' && value.startsWith('file:'));
      expect(nonStartupFiles).to.eql([]);
    } finally {
      await sample.dispose();
    }
  });

  it('build: external pure-JSR world builds without falling forward to local-source alias privilege', async () => {
    const res = await runProbe(BUILD_PROBE_SOURCE);

    expect(res.success).to.eql(true);
    const data = parseProbeJson<BuildProbeJson>(res.text.stdout);
    expect(data.ok).to.eql(true);
    expect(data.moduleTexts.some((text) => text.includes('.vite.bootstrap.'))).to.eql(false);
    expect(data.moduleTexts.some((text) => text.includes('#module-sync-enabled'))).to.eql(false);
    expect(data.moduleTexts.some((text) => text.includes("from '@sys/driver-vite'"))).to.eql(false);
    expect(data.moduleTexts.some((text) => text.includes('file:///Users/phil/code/org.sys'))).to
      .eql(false);
    expect(data.stdout.includes('built in')).to.eql(true);
  });

  it('dev: external pure-JSR world serves transformed entry without local-source alias privilege', async () => {
    const res = await runProbe(DEV_PROBE_SOURCE);

    expect(res.success).to.eql(true);
    const data = parseProbeJson<DevProbeJson>(res.text.stdout);
    expect(data.ok).to.eql(true);
    expect(data.htmlStatus).to.eql(200);
    expect(data.entryStatus).to.eql(200);
    expect(data.entryText).to.include('sample-bridge');
    expect(data.entryText).to.include('sample-bridge-http');
    expect(data.entryText.includes('.vite.bootstrap.')).to.eql(false);
    expect(data.entryText.includes('#module-sync-enabled')).to.eql(false);
    expect(data.moduleTexts.some((text) => text.includes('.vite.bootstrap.'))).to.eql(false);
    expect(data.moduleTexts.some((text) => text.includes('#module-sync-enabled'))).to.eql(false);
    expect(data.moduleTexts.some((text) => text.includes("from '@sys/driver-vite'"))).to.eql(false);
    expect(data.moduleTexts.some((text) => text.includes('file:///Users/phil/code/org.sys'))).to
      .eql(false);
  });
});

const BUILD_PROBE_SOURCE = `
  import { buildSample } from './src/m.vite/-test.external/u.fixture.build.ts';
  import { Json, SAMPLE } from './src/-test.ts';

  const res = await buildSample({
    sampleName: 'Vite.published.pure-jsr-authority.build.probe',
    sampleDir: SAMPLE.Dirs.samplePublishedBaseline,
  });
  console.log('${DEFAULTS.probeJsonPrefix}' + Json.stringify({
    ok: res.build.ok,
    stderr: res.build.cmd.output.text.stderr,
    stdout: res.build.cmd.output.text.stdout,
    moduleTexts: res.files.js.map((file) => file.text),
  }, 0));
`;

const DEV_PROBE_SOURCE = `
  import { devSample } from './src/m.vite/-test.external/u.fixture.dev.ts';
  import { Json, SAMPLE } from './src/-test.ts';

  const res = await devSample({
    sampleName: 'Vite.published.pure-jsr-authority.dev.probe',
    sampleDir: SAMPLE.Dirs.samplePublishedBaseline,
    moduleMode: 'none',
  });
  try {
    const moduleTexts = await Promise.all(
      res.entry.imports.map(async (url) => (await res.fetch(url)).text),
    );
    console.log('${DEFAULTS.probeJsonPrefix}' + Json.stringify({
      ok: true,
      htmlStatus: res.html.status,
      entryStatus: res.entry.status,
      entryText: res.entry.text,
      moduleTexts,
    }, 0));
  } finally {
    await res.dev.dispose();
  }
`;

function parseProbeJson<T>(stdout: string): T {
  const line = stdout.trim().split('\n').findLast((line) =>
    line.startsWith(DEFAULTS.probeJsonPrefix)
  );
  if (!line) throw new Error(`Probe JSON marker not found in stdout:\n${stdout.trim()}`);
  return Json.parse(line.slice(DEFAULTS.probeJsonPrefix.length)) as T;
}

async function samplePublishedImports() {
  return (
    await Fs.readJson<{ imports?: Record<string, string> }>(
      `${SAMPLE.Dirs.samplePublishedBaseline}/imports.json`,
    )
  ).data?.imports ?? {};
}

async function runProbe(source: string) {
  const cwd = ROOT.resolve('code/sys.driver/driver-vite');
  const path = Fs.join(cwd, `.tmp.published-pure-jsr-authority.${slug()}.ts`);
  await Fs.write(path, source);

  try {
    return await Process.invoke({
      cmd: 'deno',
      args: ['run', '-P=test', '--no-lock', '--node-modules-dir=auto', path],
      cwd,
      silent: true,
    });
  } finally {
    await Fs.remove(path, { log: false });
  }
}

async function externalStartupImportMap(arg: string) {
  const fs = await Fs.makeTempDir({ prefix: 'Vite.published.pure-jsr-authority.startup.' });
  const dir = Fs.join(fs.absolute, Fs.basename(SAMPLE.Dirs.samplePublishedBaseline));
  await Fs.copy(SAMPLE.Dirs.samplePublishedBaseline, dir);

  const paths = {
    cwd: dir,
    app: {
      entry: './index.html',
      outDir: 'dist',
      base: './',
    },
  } as const;

  const res = await Wrangle.command(paths, arg);
  const importMapArg = res.args.find((item) => item.startsWith('--import-map='));
  const path = importMapArg?.replace('--import-map=', '') ?? '';
  const loaded = path
    ? await Fs.readJson<{ imports?: Record<string, string>; scopes?: Record<string, unknown> }>(
      path,
    )
    : { data: undefined };

  return {
    path,
    data: loaded.data ?? {},
    dispose: async () => {
      await res.dispose();
      await Fs.remove(fs.absolute, { log: false });
    },
  } as const;
}
