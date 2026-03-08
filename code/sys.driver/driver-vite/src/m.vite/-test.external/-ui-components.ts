import { describe, expect, it, SAMPLE, Testing } from '../../-test.ts';
import { buildSample } from './u.fixture.ts';

describe('Vite published external smoke (ui-components)', () => {
  it('build: published driver-vite resolves @sys/ui-react-components and @sys/ui-react-devharness', async () => {
    await Testing.retry(2, async () => {
      const { build, files } = await buildSample({
        sampleName: 'Vite.ui-components.published.build',
        sampleDir: SAMPLE.Dirs.samplePublishedUiComponents,
      });

      expect(build.ok).to.eql(true);
      expect(files.html).to.include('<title>Sample-UI-Components</title>');
      const js = files.js.map((file) => file.text).join('\n');
      expect(js.length > 0).to.eql(true);
      expect(js.includes('Button')).to.eql(true);
      expect(js.includes('useKeyboard')).to.eql(true);
    });
  });
});
