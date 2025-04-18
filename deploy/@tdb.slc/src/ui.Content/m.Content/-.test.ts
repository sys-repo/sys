import { describe, expect, it } from '../../-test.ts';
import { Factory, factory } from '../m.Factory/mod.ts';
import { Content } from './mod.ts';

describe('Content', () => {
  it('API', () => {
    expect(Content.Factory).to.equal(Factory);
    expect(Content.factory).to.equal(factory);
  });

  describe('Content.Is', () => {
    const Is = Content.Is;
    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];

    it('Is.video', async () => {
      const test = (input: any, expected: boolean) => expect(Is.video(input)).to.eql(expected);
      test(await factory('Trailer'), true);
      test(await factory('Overview'), true);
      NON.forEach((value) => test(value, false));
    });

    it('Is.static', async () => {
      const test = (input: any, expected: boolean) => expect(Is.static(input)).to.eql(expected);
      test(await factory('Entry'), true);
      test(await factory('Programme'), true);
      NON.forEach((value) => test(value, false));
    });
  });
});
