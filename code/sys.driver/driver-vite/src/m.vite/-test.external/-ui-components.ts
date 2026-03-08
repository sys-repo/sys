import { describe, expect, it, SAMPLE, Testing } from '../../-test.ts';
import { buildSample } from './u.fixture.build.ts';
import { devSample } from './u.fixture.dev.ts';

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
      expect(js.includes('ui-react-components')).to.eql(true);
      expect(js.includes('ui-react-devharness')).to.eql(true);
    });
  });

  it('dev: published driver-vite serves ui component module graph without html fallback', async () => {
    await Testing.retry(2, async () => {
      const { dev, html, entry, modules } = await devSample({
        sampleName: 'Vite.ui-components.published.dev',
        sampleDir: SAMPLE.Dirs.samplePublishedUiComponents,
      });

      try {
        expect(html.status).to.eql(200);
        expect(entry.status).to.eql(200);
        expect(entry.text.includes('@sys/ui-react-devharness')).to.eql(false);
        expect(modules.some((mod) => mod.url.includes('ui-react-devharness'))).to.eql(true);
        expect(modules.some((mod) => mod.url.includes('ui-react-components'))).to.eql(true);
        expect(modules.some((mod) => mod.contentType.includes('text/html'))).to.eql(false);
      } finally {
        await dev.dispose();
      }
    });
  });
});
