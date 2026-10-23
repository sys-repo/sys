import { defaultTreeAdapter, html } from 'parse5';
import { describe, expect, it, type t } from '../../-test.ts';
import { Html } from '../m.Html.ts';
import { element } from './u.fixture.ts';

describe('Html trees', () => {
  describe('caller-owned trees', () => {
    it('allows mutations without changing another parse result', () => {
      const first = Html.parseFragment('<p id="one">a</p>');
      const second = Html.parseFragment('<p id="one">a</p>');
      const node = element(first.childNodes[0]);
      expect(node.parentNode).to.equal(first);
      node.attrs.push({ name: 'data-owned', value: 'yes' });
      first.childNodes.push(defaultTreeAdapter.createElement('div', html.NS.HTML, []));
      expect(first.childNodes).to.have.length(2);
      expect(second.childNodes).to.have.length(1);
      const other = element(second.childNodes[0]);
      expect(other.attrs).to.eql([{ name: 'id', value: 'one' }]);
    });
  });

  describe('treeAdapter', () => {
    it('forwards compatible adapter nodes and effects without cloning', () => {
      const made: t.Html.Element[] = [];
      const options: t.Html.ParseOptions = {
        treeAdapter: {
          ...defaultTreeAdapter,
          createElement(tagName, namespace, attrs) {
            const node = defaultTreeAdapter.createElement(tagName, namespace, attrs);
            made.push(node);
            return node;
          },
        },
      };
      const result = Html.parseFragment('<p></p>', options);
      expect(result.childNodes[0]).to.equal(made.find((node) => node.tagName === 'p'));
      expect(options).to.have.keys(['treeAdapter']);
    });
  });
});
