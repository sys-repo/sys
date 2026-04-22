import { describe, expect, it, SAMPLE, Testing } from '../../-test.ts';

import { buildSample } from './u.fixture.build.ts';
import { devSample } from './u.fixture.dev.ts';

const STD_PATH_PARENT = '/@id/__x00__deno::TypeScript::@std/path::';
const STD_PATH_CHILD = '/@id/__x00__deno::TypeScript::https://jsr.io/@std/path/1.1.4/';

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
      const { dev, html, entry, modules, fetch } = await devSample({
        sampleName: 'Vite.ui-components.published.dev',
        sampleDir: SAMPLE.Dirs.samplePublishedUiComponents,
      });

      try {
        expect(html.status).to.eql(200);
        expect(entry.status).to.eql(200);
        expect(entry.text.includes(`from '@sys/ui-react-devharness'`)).to.eql(false);
        expect(entry.text.includes(`from "@sys/ui-react-devharness"`)).to.eql(false);
        expect(modules.some((mod) => mod.url.includes('ui-react-devharness'))).to.eql(true);
        expect(modules.some((mod) => mod.url.includes('ui-react-components'))).to.eql(true);
        expect(modules.some((mod) => mod.contentType.includes('text/html'))).to.eql(false);

        const stdPath = modules.find((mod) => mod.url.includes(STD_PATH_PARENT));
        expect(Boolean(stdPath)).to.eql(true);
        if (!stdPath) throw new Error('Failed to locate wrapped @std/path module in dev graph');

        const recursiveChild = stdPath.imports.find((url) => url.includes(STD_PATH_CHILD));
        expect(Boolean(recursiveChild)).to.eql(true);
        if (!recursiveChild) {
          throw new Error('Failed to locate wrapped recursive @std/path child import');
        }

        expect(stdPath.text.includes('"/dirname.ts"')).to.eql(false);
        expect(stdPath.text.includes('"/format.ts"')).to.eql(false);
        expect(stdPath.text.includes('"/to_namespaced_path.ts"')).to.eql(false);

        const child = await fetch(recursiveChild);
        expect(child.status).to.eql(200);
        expect(child.contentType.includes('javascript')).to.eql(true);
        expect(child.text.includes('/@id/__x00__deno::TypeScript::')).to.eql(true);
        expect(child.text.includes('text/html')).to.eql(false);
      } finally {
        await dev.dispose();
      }
    });
  });
});
