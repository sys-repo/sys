import { describe, expect, it, SAMPLE, Testing } from '../../-test.ts';
import { buildSample } from './u.fixture.build.ts';
import { devSample } from './u.fixture.dev.ts';

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
      const { dev, html, main } = await devSample({
        sampleName: 'Vite.bridge.published.dev',
        sampleDir: SAMPLE.Dirs.samplePublishedBaseline,
      });

      try {
        expect(html.status).to.eql(200);
        expect(main.status).to.eql(200);
        expect(main.text).to.include('sample-bridge');
        expect(main.text).to.include('sample-bridge-http');
        expect(main.text.includes('@sys/std')).to.eql(false);
      } finally {
        await dev.dispose();
      }
    });
  });
});
