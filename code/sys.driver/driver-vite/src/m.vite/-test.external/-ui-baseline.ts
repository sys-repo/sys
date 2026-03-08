import { describe, expect, it, SAMPLE, Testing } from '../../-test.ts';
import { buildSample } from './u.fixture.ts';

describe('Vite published external smoke (ui-baseline)', () => {
  it('build: published driver-vite resolves @sys/ui-* (baseline modules) from dedicated fixture', async () => {
    await Testing.retry(2, async () => {
      const { build, files } = await buildSample(
        'Vite.ui-react.published.build',
        SAMPLE.Dirs.sampleUiBaselinePublished,
      );

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
