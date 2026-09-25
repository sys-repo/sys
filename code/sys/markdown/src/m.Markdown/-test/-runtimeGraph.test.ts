import { describe, EsmAssert, expect, it, packageRootEntry } from '../../-test.ts';
import { Markdown } from '../mod.ts';
import { Forbidden, requireData, Sample } from './u.fixture.ts';

describe('Markdown.runtime graph', () => {
  it('does not require @sys/fs to parse and stringify Markdown', async () => {
    const parsed = requireData(Markdown.parse(Sample.headingAndTaskList));
    const text = requireData(Markdown.stringify(parsed));

    expect(text).to.contain('# Hello');
    expect(text).to.contain('[x] done');

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
});
