import { type t, describe, it, expect } from '../-test.ts';
import { ReactChildren } from './mod.ts';

describe('ReactChildren', () => {
  describe('deps', () => {
    const deps = ReactChildren.deps;

    it('returns empty string when there are no valid element children', () => {
      console.log(deps(undefined));
      expect(deps(undefined)).to.eql('');
      expect(deps(null)).to.eql('');
    });

    it('returns the element type when there is a single element without a key', () => {
      function Foo() {
        return null;
      }
      expect(deps(<div />)).to.eql('div');
      expect(deps(<Foo />)).to.eql('Foo');
    });

    it('returns the element key when a single element has a key', () => {
      function Bar() {
        return null;
      }
      expect(deps(<Bar key={'bazKey'} />)).to.eql('bazKey');
    });

    it('returns a pipeseparated list of keys for multiple keyed children', () => {
      const result = deps([<header key={'h'} />, <footer key={'f'} />]);
      expect(result).to.eql('h|f');
    });

    it('includes string and number children before elements, in order', () => {
      const result = deps(['hello', 123, <section key={'s'} />, null, <article />]);
      expect(result).to.eql('hello|123|s|article');
    });
  });
});
