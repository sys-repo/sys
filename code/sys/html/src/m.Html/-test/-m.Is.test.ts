import { describe, expect, it } from '../../-test.ts';
import { Html } from '../m.Html.ts';
import { Is } from '../m.Is.ts';

describe('Html.Is', () => {
  it('rejects missing nodes, roots, text and comments', () => {
    const fragment = Html.parseFragment('text<!--comment-->');
    const [text, comment] = fragment.childNodes;
    const nonElements = [null, undefined, fragment, Html.parse(''), text, comment];
    for (const node of nonElements) {
      expect(Is.element(node)).to.eql(false);
      expect(Is.template(node)).to.eql(false);
    }
  });

  describe('element', () => {
    it('recognizes regular elements and HTML templates', () => {
      const fragment = Html.parseFragment('<p></p><template></template>');
      const [paragraph, template] = fragment.childNodes;
      expect(Is.element(paragraph)).to.eql(true);
      expect(Is.element(template)).to.eql(true);
    });
  });

  describe('template', () => {
    it('narrows HTML templates and exposes their separate content', () => {
      const fragment = Html.parseFragment('<p></p><template><b></b></template>');
      const [paragraph, template] = fragment.childNodes;
      expect(Is.template(paragraph)).to.eql(false);
      expect(Is.template(template)).to.eql(true);
      if (!Is.template(template)) throw new Error('expected template');
      expect(template.childNodes).to.eql([]);
      expect(template.content.nodeName).to.eql('#document-fragment');
      expect(template.content.childNodes.map((node) => node.nodeName)).to.eql(['b']);
    });

    it('rejects SVG and MathML template lookalikes without rejecting them as elements', () => {
      const fragment = Html.parseFragment('<svg><template/></svg><math><template/></math>');
      for (const root of fragment.childNodes) {
        if (!Is.element(root)) throw new Error('expected foreign root');
        const template = root.childNodes[0];
        expect(Is.element(template)).to.eql(true);
        expect(Is.template(template)).to.eql(false);
      }
    });
  });
});
