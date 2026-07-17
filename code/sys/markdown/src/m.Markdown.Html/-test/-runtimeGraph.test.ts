import { describe, EsmAssert, expect, it, packageRootEntry } from '../../-test.ts';
import { Html } from '../mod.ts';
import { Forbidden, requireData, Sample } from './u.fixture.ts';

describe('Markdown.Html.runtime graph', () => {
  it('does not require @sys/fs to render Markdown HTML', async () => {
    const html = requireData(Html.render(Sample.commonmarkDocument));

    expect(html).to.contain('<h1>Hello</h1>');

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
