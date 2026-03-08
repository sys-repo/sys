import { type t, describe, expect, Fs, Http, it, pkg, SAMPLE, Testing } from '../../-test.ts';
import { Vite } from '../mod.ts';

describe('Vite published external smoke (baseline)', () => {
  it('build: published driver-vite resolves @sys imports from dedicated fixture', async () => {
    await Testing.retry(2, async () => {
      const fs = SAMPLE.fs('Vite.bridge.published.build');
      await Fs.copy(SAMPLE.Dirs.sampleBridgePublished, fs.dir);

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

      const distFilename = Fs.join(outDir, 'dist.json');
      const dist = (await Fs.readJson<t.DistPkg>(distFilename)).data;
      const files = Object.keys(dist?.hash?.parts ?? {});
      const jsFiles = files.filter((path) => path.endsWith('.js'));
      const jsText = await Promise.all(
        jsFiles.map(async (path) => (await Fs.readText(Fs.join(outDir, path))).data ?? ''),
      );
      expect(jsText.some((text) => text.includes('sample-bridge'))).to.eql(true);
      expect(jsText.some((text) => text.includes('sample-bridge-http'))).to.eql(true);
    });
  });

  it('dev: published driver-vite serves transformed module with @sys imports', async () => {
    await Testing.retry(2, async () => {
      const port = Testing.randomPort();
      const fs = SAMPLE.fs('Vite.bridge.published.dev');
      await Fs.copy(SAMPLE.Dirs.sampleBridgePublished, fs.dir);

      const server = await Vite.dev({ cwd: fs.dir, port, silent: true });

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
