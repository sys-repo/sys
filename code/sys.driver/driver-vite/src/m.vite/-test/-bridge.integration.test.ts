import { describe, expect, Fs, Http, it, pkg, SAMPLE, Testing } from '../../-test.ts';
import { Vite } from '../mod.ts';

describe('Vite @sys bridge integration', () => {
  it.skip('build: resolves @sys imports from dedicated fixture', async () => {
    // This fixture still imports the published `jsr:@sys/driver-vite`, not the local
    // source module. Keep it skipped until the published package catches up or the
    // fixture is explicitly rebound to local driver-vite sources for owned-boundary testing.
    await Testing.retry(2, async () => {
      const fs = SAMPLE.fs('Vite.bridge.build');
      await Fs.copy(SAMPLE.Dirs.sampleBridge, fs.dir);

      const res = await Vite.build({
        cwd: fs.dir,
        pkg,
        silent: true,
        spinner: false,
        exitOnError: false,
      });

      expect(res.ok).to.eql(true);

      const outDir = Fs.join(res.paths.cwd, res.paths.app.outDir);
      const html = (await Fs.readText(Fs.join(outDir, 'index.html'))).data ?? '';
      expect(html).to.include('<title>Sample-Bridge</title>');

      const dist = (
        await Fs.readJson<{ hash?: { parts?: Record<string, string> } }>(
          Fs.join(outDir, 'dist.json'),
        )
      ).data;
      const files = Object.keys(dist?.hash?.parts ?? {});
      const jsFiles = files.filter((path) => path.endsWith('.js'));
      const jsText = await Promise.all(
        jsFiles.map(async (path) => (await Fs.readText(Fs.join(outDir, path))).data ?? ''),
      );
      expect(jsText.some((text) => text.includes('sample-bridge'))).to.eql(true);
      expect(jsText.some((text) => text.includes('sample-bridge-http'))).to.eql(true);
    });
  });

  it.skip('dev: serves transformed module with @sys imports', async () => {
    // Published-package gate:
    // this fixture imports `jsr:@sys/driver-vite`, so CI still exercises the
    // last published package rather than the local source adapter.
    // Restore this guard after the next driver-vite publish lands.
    await Testing.retry(2, async () => {
      const fs = SAMPLE.fs('Vite.bridge.dev');
      await Fs.copy(SAMPLE.Dirs.sampleBridge, fs.dir);

      const server = await Vite.dev({ cwd: fs.dir, port: Testing.randomPort(), silent: true });
      try {
        await Http.Client.waitFor(server.url, { timeout: 10_000, interval: 200 });

        const html = await fetch(server.url);
        expect(html.status).to.eql(200);
        await html.text();

        const main = await fetch(`${server.url}main.ts`);
        const text = await main.text();
        expect(main.status).to.eql(200);
        expect(text).to.include('sample-bridge');
        expect(text).to.include('sample-bridge-http');
        expect(text.includes('@sys/std')).to.eql(false);
      } finally {
        await server.dispose();
      }
    });
  });
});
