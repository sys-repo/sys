import { describe, expect, it, SAMPLE, Testing } from '../../-test.ts';

// 🐷 Temporarily skipped during the startup seam refactor campaign.
// This published-boundary lane is tracked separately and will be re-enabled
// after the local refactor move is complete and the published/external lane is
// revalidated explicitly.
import { buildSample } from './u.fixture.ts';

describe.skip('Vite published external smoke (ui-baseline)', () => {
  it('build: published driver-vite resolves static tsx ui baseline imports', async () => {
    await Testing.retry(2, async () => {
      const { build, files } = await buildSample({
        sampleName: 'Vite.ui-baseline.published.build.static',
        sampleDir: SAMPLE.Dirs.samplePublishedUiBaseline,
        entry: './index.static.html',
      });

      expect(build.ok).to.eql(true);
      expect(files.html).to.include('<title>Sample-UI-Baseline</title>');
      expect(files.js.length > 0).to.eql(true);
      expect(files.js.some((file) => file.text.length > 0)).to.eql(true);
    });
  });

  it('build: published driver-vite resolves dynamic tsx ui baseline imports', async () => {
    await Testing.retry(2, async () => {
      const { build, files } = await buildSample({
        sampleName: 'Vite.ui-baseline.published.build.dynamic',
        sampleDir: SAMPLE.Dirs.samplePublishedUiBaseline,
        entry: './index.dynamic.html',
      });

      expect(build.ok).to.eql(true);
      expect(files.html).to.include('<title>Sample-UI-Baseline</title>');

      const js = files.js.map((file) => file.text).join('\n');
      expect(js.includes('Signal')).to.eql(true);
      expect(js.includes('Dom')).to.eql(true);
      expect(js.includes('Keyboard')).to.eql(true);
      expect(js.includes('UserAgent')).to.eql(true);
      expect(js.includes('LocalStorage')).to.eql(true);
      expect(js.includes('Style')).to.eql(true);
    });
  });
});
