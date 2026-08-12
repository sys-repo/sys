import { describe, expect, Fs, it, SAMPLE, stripAnsi } from '../../-test.ts';
import { buildSample, type SerializedBuild } from '../-test.external/u.fixture.build.ts';
import { runFixtureProcess } from './u.fixture-process.ts';

const STRICT_FIXTURE = Fs.Path.fromFileUrl(
  new URL('./fixture.strict-in-process-build.ts', import.meta.url),
);
const PACKAGE_DIR = Fs.Path.fromFileUrl(new URL('../../../', import.meta.url));
const MARKERS = {
  ready: 'SYS:VITE:STRICT-IN-PROCESS:READY',
  execution: 'SYS:VITE:STRICT-IN-PROCESS:EXECUTION',
  buildOk: 'SYS:VITE:STRICT-IN-PROCESS:BUILD-OK',
} as const;

describe('Vite external-fixture lifecycle under local equivalent authority', () => {
  it('proves the published baseline build lifecycle with strict sanitizers', async () => {
    const { build, files } = await buildSample({
      sampleName: 'Vite.published-baseline.local-lifecycle',
      sampleDir: SAMPLE.Dirs.sampleBridge,
      local: true,
    });

    assertBuildOk(build);
    expect(files.html).to.include('<title>Sample-Bridge</title>');
    expect(files.js.some((file) => file.text.includes('sample-bridge'))).to.eql(true);
  });

  it('proves the published UI baseline build lifecycle with strict sanitizers', async () => {
    const { build, files } = await buildSample({
      sampleName: 'Vite.published-ui-baseline.local-lifecycle',
      sampleDir: SAMPLE.Dirs.sample1,
      local: true,
    });

    assertBuildOk(build);
    expect(files.html).to.include('<title>Sample-1</title>');
    expect(files.js.length > 0).to.eql(true);
  });

  it('proves the published UI components build lifecycle with strict sanitizers', async () => {
    const { build, files } = await buildSample({
      sampleName: 'Vite.published-ui-components.local-lifecycle',
      sampleDir: SAMPLE.Dirs.sample3,
      local: true,
    });

    assertBuildOk(build);
    expect(files.html).to.include('<title>Sample-1</title>');
    expect(files.js.length > 0).to.eql(true);
  });

  it('proves the child boundary remains load-bearing with a causal strict alarm', async () => {
    const result = await runFixtureProcess({
      label: 'Vite strict in-process build fixture',
      args: ['test', '-P=test', '--trace-leaks', STRICT_FIXTURE],
      cwd: PACKAGE_DIR,
      marker: MARKERS.ready,
      startupTimeout: 20_000,
      executionTimeout: 60_000,
      drainTimeout: 5_000,
    });
    const stdout = stripAnsi(result.stdout);
    const stderr = stripAnsi(result.stderr);

    expect(result.timeout).to.eql(undefined);
    expect(result.captureError).to.eql(undefined);
    expect(result.markerReached).to.eql(true);
    expect(result.code).to.eql(1);
    expect(result.signal).to.eql(undefined);

    for (const marker of Object.values(MARKERS)) {
      expect(stdout).to.include(marker);
      expect(stderr).to.not.include(marker);
    }
    expect(stdout).to.include('Leaks detected');
    expect(stdout).to.include('async operations to get the next signal');
    expect(stdout).to.include('SignalExit.load');
    expect(stdout).to.include('rolldown@1.2.3');
    expect(stderr).to.not.include('Leaks detected');
  });
});

function assertBuildOk(build: SerializedBuild) {
  if (build.ok) return;
  const { stderr, stdout } = build.cmd.output.text;
  throw new Error(`Vite fixture build failed:\n${stderr || stdout || '(no process output)'}`);
}
