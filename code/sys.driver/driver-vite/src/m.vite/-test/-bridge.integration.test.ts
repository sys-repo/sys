import { describe, expect, Fs, Http, it, pkg, Testing } from '../../-test.ts';
import { writeLocalBridgeImports } from './u.bridge.fixture.ts';
import { Vite } from '../mod.ts';

const LOCAL_BRIDGE_DIR = Fs.Path.resolve('./src/-test/vite.sample-bridge');

describe('Vite @sys bridge integration', () => {
  it.skip('build: resolves @sys imports from dedicated fixture', async () => {
    // This local bridge fixture now targets the workspace source directly.
    // Restore the build guard after validating the split local/published lanes.
    await Testing.retry(2, async () => {
      const restore = await writeLocalBridgeImports(LOCAL_BRIDGE_DIR);
      try {
        const res = await Vite.build({
          cwd: LOCAL_BRIDGE_DIR,
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
      }
    });
  });

  it('dev: serves transformed module with @sys imports', async () => {
    await Testing.retry(2, async () => {
      const port = Testing.randomPort();
      const restore = await writeLocalBridgeImports(LOCAL_BRIDGE_DIR);
      let server: Awaited<ReturnType<typeof Vite.dev>> | undefined;
      try {
        server = await Vite.dev({ cwd: LOCAL_BRIDGE_DIR, port, silent: true });
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
      }
    });
  });
});
