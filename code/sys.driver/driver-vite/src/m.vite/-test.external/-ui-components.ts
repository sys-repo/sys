import { describe, expect, it, SAMPLE, Testing } from '../../-test.ts';

import { buildSample } from './u.fixture.build.ts';
import { devSample } from './u.fixture.dev.ts';

const STD_PATH_PARENT = '/@id/__x00__deno::TypeScript::@std/path::';
const STD_PATH_CHILD = '@std/path/1.1.4/';

describe(
  'Vite published external smoke (ui-components build)',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    it('published driver-vite resolves @sys/ui-react-components and @sys/ui-react-devharness', async () => {
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
  },
);

describe('Vite published external smoke (ui-components dev)', () => {
  it('published driver-vite serves ui component module graph without html fallback', async () => {
    await Testing.retry(2, async () => {
      const { dev, html, entry, fetch } = await devSample({
        sampleName: 'Vite.ui-components.published.dev',
        sampleDir: SAMPLE.Dirs.samplePublishedUiComponents,
        moduleMode: 'none',
      });

      try {
        expect(html.status).to.eql(200);
        expect(entry.status).to.eql(200);
        expect(entry.text.includes(`from '@sys/ui-react-devharness'`)).to.eql(false);
        expect(entry.text.includes(`from "@sys/ui-react-devharness"`)).to.eql(false);

        const buttonUrl = directImport(entry.imports, '@sys/ui-react-components/button', 'ui-react-components/button');
        const devHarnessUrl = directImport(entry.imports, '@sys/ui-react-devharness', 'ui-react-devharness');
        const stdPathUrl = directImport(entry.imports, STD_PATH_PARENT, '@std/path');

        const button = await fetch(buttonUrl);
        const devHarness = await fetch(devHarnessUrl);
        const stdPath = await fetch(stdPathUrl);
        const stdPathImports = imports(stdPath.url, stdPath.text);
        const recursiveChild = directImport(stdPathImports, STD_PATH_CHILD, 'recursive @std/path child import');
        const child = await fetch(recursiveChild);

        for (const mod of [button, devHarness, stdPath, child]) {
          expect(mod.status).to.eql(200);
          expect(mod.contentType.includes('text/html')).to.eql(false);
        }

        expect(button.contentType.includes('javascript')).to.eql(true);
        expect(devHarness.contentType.includes('javascript')).to.eql(true);
        expect(stdPath.contentType.includes('javascript')).to.eql(true);
        expect(child.contentType.includes('javascript')).to.eql(true);
        expect(stdPath.text.includes('"/dirname.ts"')).to.eql(false);
        expect(stdPath.text.includes('"/format.ts"')).to.eql(false);
        expect(stdPath.text.includes('"/to_namespaced_path.ts"')).to.eql(false);
        expect(child.text.includes('/@id/__x00__deno::TypeScript::')).to.eql(true);
      } finally {
        await dev.dispose();
      }
    });
  });
});

function directImport(imports: readonly string[], fragment: string, label: string) {
  const found = imports.find((url) => url.includes(fragment));
  if (found) return found;
  throw new Error(
    `Failed to locate ${label} import in dev module graph.\n\nimports:\n${imports.join('\n')}`,
  );
}

function imports(baseUrl: string, text: string) {
  const values = [
    ...text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
    ...text.matchAll(/\bimport\s+[^"'`]*?\bfrom\s+["']([^"']+)["']/g),
    ...text.matchAll(/\bexport\s+[^"'`]*?\bfrom\s+["']([^"']+)["']/g),
  ].map((match) => match[1]);

  return [...new Set(values.map((value) => resolve(baseUrl, value)).filter(Boolean))];
}

function resolve(baseUrl: string, value: string) {
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) {
    return new URL(value, baseUrl).href;
  }
  if (value.startsWith('@') || /^[a-z0-9][^:]*$/i.test(value)) {
    return new URL(`/@id/${encodeURIComponent(value)}`, baseUrl).href;
  }
  return '';
}
