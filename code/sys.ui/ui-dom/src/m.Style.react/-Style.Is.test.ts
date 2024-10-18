import { describe, expect, it } from '../-test.ts';
import { Emotion } from './emotion-js/mod.ts';
import { css } from './mod.ts';
import { Is } from './u.ts';

describe('Style.Is (flags)', () => {
  const NON = [123, 'hello', true, [], {}, Symbol('foo'), BigInt(0), undefined, null];

  describe('Is.serizlisedStyle (emotion)', () => {
    it('is not: serizlisedStyle', () => {
      NON.forEach((v) => expect(Is.serizlisedStyle(v)).to.eql(false));
    });

    it('is: serizlisedStyle', () => {
      const res = Emotion.css({ color: 'red' });
      expect(Is.serizlisedStyle(res)).to.eql(true);
    });
  });

  describe('Is.reactCssObject', () => {
    it('is not: reactCssObject', () => {
      NON.forEach((v) => expect(Is.reactCssObject(v)).to.eql(false));
    });

    it('is: reactCssObject', () => {
      const style = css({ color: 'red' });
      expect(Is.reactCssObject(style)).to.eql(true);
      expect(Is.reactCssObject(style.css)).to.eql(false);
    });
  });
});
