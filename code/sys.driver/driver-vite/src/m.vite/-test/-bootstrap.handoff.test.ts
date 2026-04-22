import { describe, expect, Fs, Http, it, pkg, SAMPLE, Testing } from '../../-test.ts';
import { Vite } from '../mod.ts';
import { writeLocalBridgeImports } from './u.bridge.fixture.ts';

describe('Bootstrap startup handoff world', () => {
  it('build: startup-only bootstrap specifiers do not leak into bundled app output', async () => {
    await Testing.retry(2, async () => {
      const fs = await Fs.makeTempDir({ prefix: 'Vite.bootstrap.handoff.build.' });
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
        const dist = (
          await Fs.readJson<{ hash?: { parts?: Record<string, string> } }>(
            Fs.join(outDir, 'dist.json'),
          )
        ).data;
        const files = Object.keys(dist?.hash?.parts ?? {});
        const jsFiles = files.filter((path) => path.endsWith('.js'));
        const jsText = (await Promise.all(
          jsFiles.map(async (path) => (await Fs.readText(Fs.join(outDir, path))).data ?? ''),
        )).join('\n');

        expect(jsText.includes('sample-bridge')).to.eql(true);
        expect(jsText.includes('sample-bridge-http')).to.eql(true);
        expect(jsText.includes('.vite.bootstrap.')).to.eql(false);
        expect(jsText.includes('#module-sync-enabled')).to.eql(false);
      } finally {
        await restore();
        await Fs.remove(fs.absolute, { log: false });
      }
    });
  });

  it('dev: served entry reflects runtime ownership after startup handoff', async () => {
    await Testing.retry(2, async () => {
      const port = Testing.randomPort();
      const fs = await Fs.makeTempDir({ prefix: 'Vite.bootstrap.handoff.dev.' });
      const dir = Fs.join(fs.absolute, Fs.basename(SAMPLE.Dirs.sampleBridge));
      await Fs.copy(SAMPLE.Dirs.sampleBridge, dir);
      const restore = await writeLocalBridgeImports(dir);
      const paths = Vite.Config.paths({ cwd: dir, app: { entry: './index.html' } });
      let server: Awaited<ReturnType<typeof Vite.dev>> | undefined;

      try {
        server = await Vite.dev({ paths, port, silent: true });
        await Http.Client.waitFor(server.url, { timeout: 10_000, interval: 200 });

        const main = await fetch(`${server.url}main.ts`);
        const text = await main.text();
        expect(main.status).to.eql(200);
        expect(text).to.include('sample-bridge');
        expect(text).to.include('sample-bridge-http');
        expect(text.includes('@sys/std')).to.eql(false);
        expect(text.includes('.vite.bootstrap.')).to.eql(false);
        expect(text.includes('#module-sync-enabled')).to.eql(false);
      } finally {
        if (server) await server.dispose();
        await restore();
        await Fs.remove(fs.absolute, { log: false });
      }
    });
  });
});
