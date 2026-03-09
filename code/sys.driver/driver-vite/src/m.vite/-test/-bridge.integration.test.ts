import { describe, expect, Fs, Http, it, pkg, SAMPLE, Testing } from '../../-test.ts';
import { Vite } from '../mod.ts';
import { writeLocalBridgeImports } from './u.bridge.fixture.ts';

describe('Vite @sys bridge integration', () => {
  it('build: resolves @sys imports from dedicated fixture', async () => {
    await Testing.retry(2, async () => {
      const fs = await Fs.makeTempDir({ prefix: 'Vite.bridge.build.' });
      const dir = Fs.join(fs.absolute, Fs.basename(SAMPLE.Dirs.sampleBridge));
      await Fs.copy(SAMPLE.Dirs.sampleBridge, dir);
      const restore = await writeLocalBridgeImports(dir);
      const paths = Vite.Config.paths({ cwd: dir, app: { entry: './index.html' } });
      try {
        const res = await Vite.build({
          paths,
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
      } finally {
        await restore();
        await Fs.remove(fs.absolute, { log: false });
      }
    });
  });

  it('dev: serves transformed module with @sys imports', async () => {
    await Testing.retry(2, async () => {
      const port = Testing.randomPort();
      const fs = await Fs.makeTempDir({ prefix: 'Vite.bridge.dev.' });
      const dir = Fs.join(fs.absolute, Fs.basename(SAMPLE.Dirs.sampleBridge));
      await Fs.copy(SAMPLE.Dirs.sampleBridge, dir);
      const restore = await writeLocalBridgeImports(dir);
      const paths = Vite.Config.paths({ cwd: dir, app: { entry: './index.html' } });
      let server: Awaited<ReturnType<typeof Vite.dev>> | undefined;
      try {
        server = await Vite.dev({ paths, port, silent: true });
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
        if (server) await server.dispose();
        await restore();
        await Fs.remove(fs.absolute, { log: false });
      }
    });
  });
});
