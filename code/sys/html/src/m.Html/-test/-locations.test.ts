import { defaultTreeAdapter, html } from 'parse5';
import { describe, expect, Is, it } from '../../-test.ts';
import { Html } from '../../mod.ts';
import { element } from './u.fixture.ts';

describe('Html source locations', () => {
  it('defaults locations off but a non-null callback enables them even against false', () => {
    const source = '<p>x</p>';
    const locationsOff = [undefined, { sourceCodeLocationInfo: false }, { onParseError: null }];
    for (const options of locationsOff) {
      const node = element(Html.parseFragment(source, options).childNodes[0]);
      expect(node.sourceCodeLocation).to.eql(undefined);
    }
    const locationsOn = [
      { sourceCodeLocationInfo: true },
      { sourceCodeLocationInfo: false, onParseError: () => {} },
    ];
    for (const options of locationsOn) {
      const node = element(Html.parseFragment(source, options).childNodes[0]);
      expect(node.sourceCodeLocation).to.include({ startOffset: 0, endOffset: 8 });
    }
  });

  it('preserves original UTF-16 slices despite CRLF, astral text, entities and case folding', () => {
    // Explicit CRLF is part of the source-position contract.
    const source = '😀\r\n<A HREF="/a?x=1&amp;y=2" DATA-X=plain>é&amp;</A>';
    const fragment = Html.parseFragment(source, { sourceCodeLocationInfo: true });
    const node = element(fragment.childNodes[1]);
    expect(node.tagName).to.eql('a');
    expect(node.attrs).to.eql([
      { name: 'href', value: '/a?x=1&y=2' },
      { name: 'data-x', value: 'plain' },
    ]);
    const span = node.sourceCodeLocation;
    if (!span?.attrs || !span.startTag || !span.endTag) throw new Error('expected explicit spans');
    expect(span).to.include({
      startOffset: 4,
      endOffset: source.length,
      startLine: 2,
      startCol: 1,
    });
    expect(source.slice(span.startOffset, span.endOffset)).to.eql(source.slice(4));
    const href = span.attrs.href;
    expect(source.slice(href.startOffset, href.endOffset)).to.eql('HREF="/a?x=1&amp;y=2"');
    const data = span.attrs['data-x'];
    expect(source.slice(data.startOffset, data.endOffset)).to.eql('DATA-X=plain');
    expect(source.slice(span.endTag.startOffset, span.endTag.endOffset)).to.eql('</A>');
    expect(node.childNodes[0]).to.include({ value: 'é&' });
    node.attrs[0].value = 'changed';
    expect(source.slice(href.startOffset, href.endOffset)).to.eql('HREF="/a?x=1&amp;y=2"');
  });

  it('keeps an adjacent slash inside an unquoted attribute value', () => {
    const source = '<img src=/asset/>';
    const fragment = Html.parseFragment(source, { sourceCodeLocationInfo: true });
    const node = element(fragment.childNodes[0]);
    expect(node.attrs).to.eql([{ name: 'src', value: '/asset/' }]);
    const span = node.sourceCodeLocation?.attrs?.src;
    if (!span) throw new Error('expected attribute span');
    expect(source.slice(span.startOffset, span.endOffset)).to.eql('src=/asset/');
    expect(node.sourceCodeLocation?.endTag).to.eql(undefined);
  });

  it('does not invent locations for implied roots or template fragments, or missing end tags', () => {
    const doc = Html.parse('<p>x', { sourceCodeLocationInfo: true });
    const root = element(doc.childNodes[0]);
    expect(Is.nil(root.sourceCodeLocation)).to.eql(true);
    const body = element(root.childNodes[1]);
    expect(Is.nil(body.sourceCodeLocation)).to.eql(true);
    const paragraph = element(body.childNodes[0]);
    expect(paragraph.sourceCodeLocation?.startTag?.startOffset).to.eql(0);
    expect(paragraph.sourceCodeLocation?.endTag).to.eql(undefined);
    const template = Html.parseFragment('<template><b>x</b></template>', {
      sourceCodeLocationInfo: true,
    }).childNodes[0];
    if (!Html.Is.template(template)) throw new Error('expected template');
    expect(Is.nil(template.content.sourceCodeLocation)).to.eql(true);
    expect(template.content.childNodes[0].sourceCodeLocation?.startOffset).to.eql(10);
  });

  it('reports fragment offsets in the fragment input, not the context markup', () => {
    const context = defaultTreeAdapter.createElement('table', html.NS.HTML, []);
    const source = '<tr><td>x</td></tr>';
    const fragment = Html.parseFragment(context, source, { sourceCodeLocationInfo: true });
    const tbody = element(fragment.childNodes[0]);
    expect(Is.nil(tbody.sourceCodeLocation)).to.eql(true);
    const row = element(tbody.childNodes[0]);
    const span = row.sourceCodeLocation;
    if (!span) throw new Error('expected row span');
    expect(span.startOffset).to.eql(0);
    expect(source.slice(span.startOffset, span.endOffset)).to.eql(source);
  });
});
