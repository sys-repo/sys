import { describe, expect, it } from '../../-test.ts';
import { Html } from '../mod.ts';
import { requireData, Sample } from './u.fixture.ts';

describe('Markdown.Html.security', () => {
  it('does not pass raw embedded HTML through the default renderer', () => {
    const html = requireData(Html.render(Sample.unsafeRawHtml));

    expect(html).not.to.contain('<script');
    expect(html).not.to.contain('onclick');
    expect(html).not.to.contain('<strong');
  });

  it('does not preserve javascript: links as dangerous href attributes', () => {
    const html = requireData(Html.render(Sample.unsafeJavascriptLink));

    expect(html).to.contain('bad');
    expect(html).not.to.contain('javascript:');
    expect(html).not.to.contain('href=');
  });
});
