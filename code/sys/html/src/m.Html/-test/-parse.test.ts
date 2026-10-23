import { defaultTreeAdapter, html } from 'parse5';
import { describe, expect, it, type t } from '../../-test.ts';
import { Html } from '../../mod.ts';
import { element } from './u.fixture.ts';

describe('Html parsing', () => {
  it('distinguishes documents and fragments, including empty input', () => {
    const doc = Html.parse('');
    expect(doc.nodeName).to.eql('#document');
    const root = element(doc.childNodes[0]);
    expect(root.tagName).to.eql('html');
    expect(root.childNodes.map((node) => node.nodeName)).to.eql(['head', 'body']);
    expect(Html.parseFragment('').childNodes).to.eql([]);
    const explicit = Html.parse('<!doctype html><title>T</title><p>P');
    expect(explicit.childNodes.map((node) => node.nodeName)).to.eql(['#documentType', 'html']);
    expect(explicit.mode).to.eql('no-quirks');
    expect(Html.parseFragment('<p>P').nodeName).to.eql('#document-fragment');
  });

  it('recovers malformed nesting and closes paragraphs without a result envelope', () => {
    const fragment = Html.parseFragment('<p>one<p>two');
    expect(fragment.childNodes.map((node) => node.nodeName)).to.eql(['p', 'p']);
    expect(element(fragment.childNodes[0]).childNodes[0]).to.include({ value: 'one' });
    expect(element(fragment.childNodes[1]).childNodes[0]).to.include({ value: 'two' });
  });

  it('uses table and textarea context rather than treating all fragments alike', () => {
    const table = defaultTreeAdapter.createElement('table', html.NS.HTML, []);
    const fragment = Html.parseFragment(table, '<tr><td>A</td></tr>', {});
    const tbody = element(fragment.childNodes[0]);
    expect(tbody.tagName).to.eql('tbody');
    const row = element(tbody.childNodes[0]);
    expect(row.tagName).to.eql('tr');
    expect(element(row.childNodes[0]).tagName).to.eql('td');
    expect(table.childNodes).to.eql([]);
    const textarea = defaultTreeAdapter.createElement('textarea', html.NS.HTML, []);
    const text = Html.parseFragment(textarea, '<b>&amp;</b>', {});
    expect(text.childNodes).to.have.length(1);
    expect(text.childNodes[0]).to.include({ nodeName: '#text', value: '<b>&</b>' });
    expect(Html.parseFragment(null, '<tr><td>A</td></tr>', {}).childNodes[0].nodeName).to.eql('tr');
    expect(Html.parseFragment('<tr><td>A</td></tr>').childNodes[0].nodeName).to.eql('tr');
  });

  it('uses an explicit foreign fragment context', () => {
    const svg = defaultTreeAdapter.createElement('svg', html.NS.SVG, []);
    const fragment = Html.parseFragment(svg, '<circle/><template/>', {});
    const namespaces = fragment.childNodes.map((node) => element(node).namespaceURI);
    expect(namespaces).to.eql(['http://www.w3.org/2000/svg', 'http://www.w3.org/2000/svg']);
    expect(Html.Is.template(fragment.childNodes[1])).to.eql(false);
  });

  it('preserves foreign namespaces, HTML integration points and attribute prefixes', () => {
    const fragment = Html.parseFragment(
      '<svg><a xlink:href="a&amp;b"/><foreignObject><p>P</p></foreignObject></svg><math><mi>x</mi></math>',
    );
    const svg = element(fragment.childNodes[0]);
    expect(svg.namespaceURI).to.eql('http://www.w3.org/2000/svg');
    const anchor = element(svg.childNodes[0]);
    expect(anchor.attrs).to.eql([{
      name: 'href',
      value: 'a&b',
      prefix: 'xlink',
      namespace: 'http://www.w3.org/1999/xlink',
    }]);
    const foreign = element(svg.childNodes[1]);
    expect(foreign.tagName).to.eql('foreignObject');
    expect(element(foreign.childNodes[0]).namespaceURI).to.eql('http://www.w3.org/1999/xhtml');
    const math = element(fragment.childNodes[1]);
    expect(math.namespaceURI).to.eql('http://www.w3.org/1998/Math/MathML');
  });

  it('preserves the scripting default and the explicit noscript parsing flag', () => {
    const source = '<noscript><b>text</b></noscript>';
    const enabled = element(Html.parseFragment(source).childNodes[0]);
    expect(enabled.childNodes[0]).to.include({ nodeName: '#text', value: '<b>text</b>' });
    const disabled = element(Html.parseFragment(source, { scriptingEnabled: false }).childNodes[0]);
    expect(disabled.childNodes[0].nodeName).to.eql('b');
  });

  it('keeps the first duplicate attribute and exposes upstream diagnostics', () => {
    const errors: t.Html.ParseError[] = [];
    const fragment = Html.parseFragment('<p ID=one id=two>', {
      onParseError: (e) => errors.push(e),
    });
    expect(element(fragment.childNodes[0]).attrs).to.eql([{ name: 'id', value: 'one' }]);
    expect(errors.map((e) => e.code)).to.eql(['duplicate-attribute']);
    expect(errors[0]).to.eql({
      code: 'duplicate-attribute',
      startLine: 1,
      endLine: 1,
      startCol: 13,
      endCol: 13,
      startOffset: 12,
      endOffset: 12,
    });
    const recovered = Html.parseFragment('<p id=one id=two>');
    const paragraph = element(recovered.childNodes[0]);
    expect(paragraph.attrs[0].value).to.eql('one');
  });

  it('propagates the exact thrown callback value through both parse operations', () => {
    const sentinel = new Error('caller refusal');
    const options: t.Html.ParseOptions = {
      onParseError: () => {
        throw sentinel;
      },
    };
    const callbackPropagation = [
      () => Html.parse('<!doctype html><p id=a id=b>', options),
      () => Html.parseFragment('<p id=a id=b>', options),
    ];
    for (const call of callbackPropagation) {
      let caught: unknown;
      try {
        call();
      } catch (error) {
        caught = error;
      }
      expect(caught).to.equal(sentinel);
    }
  });
});
