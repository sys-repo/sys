import { type t, describe, expect, Fs, Http, it, SAMPLE, Testing } from '../../-test.ts';
import { Vite } from '../mod.ts';
import { buildSample } from './u.fixture.ts';

describe('Vite published external smoke (baseline)', () => {
  it('build: published driver-vite resolves @sys imports from dedicated fixture', async () => {
    await Testing.retry(2, async () => {
      const { build, files } = await buildSample({
        sampleName: 'Vite.bridge.published.build',
        sampleDir: SAMPLE.Dirs.samplePublishedBaseline,
      });

      expect(build.ok).to.eql(true);
      expect(files.html).to.include('<title>Sample-Bridge</title>');
      expect(files.js.some((file) => file.text.includes('sample-bridge'))).to.eql(true);
      expect(files.js.some((file) => file.text.includes('sample-bridge-http'))).to.eql(true);
    });
  });

  it('dev: published driver-vite serves transformed module with @sys imports', async () => {
    await Testing.retry(2, async () => {
      const port = Testing.randomPort();
      const fs = SAMPLE.fs('Vite.bridge.published.dev');
      await Fs.copy(SAMPLE.Dirs.samplePublishedBaseline, fs.dir);

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
