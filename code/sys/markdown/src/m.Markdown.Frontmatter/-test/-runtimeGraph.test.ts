import { describe, EsmAssert, expect, it, packageRootEntry } from '../../-test.ts';
import { Frontmatter } from '../mod.ts';
import { Forbidden, frontmatterEntry, requireData, Sample } from './u.fixture.ts';

describe('Markdown.Frontmatter.runtime graph', () => {
  it('does not require @sys/fs to parse Markdown frontmatter', async () => {
    const doc = requireData(Frontmatter.parse(Sample.yamlFrontmatter));

    expect(doc.frontmatter?.data).to.eql({ title: 'Hello', tags: ['markdown', 'sys'] });

    await EsmAssert.runtimeGraphBoundary({
      entry: packageRootEntry(),
      forbiddenImports: [...Forbidden.fs],
    });
  });

  it('keeps browser and UI substrates out of the package root', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: packageRootEntry(),
      forbiddenImports: [...Forbidden.browserAndUi],
    });
  });

  it('keeps HTML rendering substrates out of the frontmatter module', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: frontmatterEntry(),
      forbiddenImports: [...Forbidden.html],
    });
  });
});
