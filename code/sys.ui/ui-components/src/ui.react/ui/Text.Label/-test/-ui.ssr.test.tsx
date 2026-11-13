import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from '../../../-test.ts';
import { TextLabel } from '../mod.ts';

// No DomMock: parsing and phrasing markup must also work without a browser document.
describe('Text.Label: server rendering', () => {
  it('supported inline content → semantic phrasing without a document wrapper', () => {
    const html = renderToStaticMarkup(
      <TextLabel.UI value='Run **bold *and italic*** with `build`.' />,
    );
    expect(html).to.include('Run <strong>bold <em>and italic</em></strong> with ');
    expect(html).to.match(/<code[^>]*>build<\/code>/);
    expect(html).to.match(/^<span /);
    expect(html).not.to.match(/<(p|div|a|button|label|br)\b/);
  });

  it('unsupported spans → escaped original spelling, supported siblings remain formatted', () => {
    const html = renderToStaticMarkup(
      <TextLabel.UI value='**Save** [**help**](/help) <span>**go** &amp;</span>' />,
    );
    expect(html).to.include('<strong>Save</strong> [**help**](/help)');
    expect(html).to.include('&lt;span&gt;<strong>go</strong> &amp;&lt;/span&gt;');
    expect(html).not.to.match(/<(a|img|script)\b/);
  });

  it('rejected document → entire literal input, never raw HTML', () => {
    const html = renderToStaticMarkup(
      <TextLabel.UI value={'# **Heading**\n\n<script>bad()</script>'} />,
    );
    expect(html).to.include('# **Heading**\n\n&lt;script&gt;bad()&lt;/script&gt;');
    expect(html).not.to.include('<strong>');
    expect(html).not.to.include('<script>');
  });
});
