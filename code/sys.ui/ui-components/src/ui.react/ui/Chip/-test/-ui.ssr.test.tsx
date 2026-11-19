import { renderToStaticMarkup } from 'react-dom/server';
import { Html } from '@sys/html';
import { describe, expect, it } from '../../../-test.ts';
import { Chip } from '../mod.ts';

// No DomMock: the component must render without a browser document.
describe('Chip: server rendering', () => {
  it('bounded code → phrasing-safe markup with complete escaped content', () => {
    const text = '/-sample/<token>/example.js';
    const markup = renderToStaticMarkup(
      <p>
        Before{' '}
        <Chip.UI truncate>
          <code>{text}</code>
        </Chip.UI>{' '}
        after.
      </p>,
    );
    const fragment = Html.parseFragment(markup);
    expect(fragment.childNodes.length).to.eql(1);
    const paragraph = fragment.childNodes[0];
    if (!Html.Is.element(paragraph)) throw new Error('Expected paragraph.');
    expect(paragraph.tagName).to.eql('p');
    const childTags = paragraph.childNodes.filter(Html.Is.element).map((node) => node.tagName);
    expect(childTags).to.eql(['span']);
    expect(markup).to.include('<code>/-sample/&lt;token&gt;/example.js</code>');
  });
});
