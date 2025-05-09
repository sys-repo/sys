import React from 'react';
import { describe, expect, it } from '../-test.ts';
import { ReactChildren } from './mod.ts';

describe('ReactChildren', () => {
  describe('deps', () => {
    const deps = ReactChildren.deps;

    it('returns empty string when there are no valid element children', () => {
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
      const res = deps([<header key={'h'} />, <footer key={'f'} />]);
      expect(res).to.eql('h|f');
    });

    it('includes string and number children before elements, in order', () => {
      const res = deps(['hello', 123, <section key={'s'} />, null, false, <article />]);
      expect(res).to.eql('hello|123|s|article');
    });

    it('includes all keys within <Fragment>', () => {
      const el1 = (
        <React.Fragment>
          {'hello'}
          {123}
          <section key={'s'} />
          {null}
          {false}
          <article />
        </React.Fragment>
      );

      const el2 = (
        <>
          {'hello'}
          {123}
          <section key={'s'} />
          {null}
          {false}
          <article />
        </>
      );

      expect(deps(el1)).to.eql('hello|123|s|article');
      expect(deps(el2)).to.eql('hello|123|s|article');
    });
  });
});
