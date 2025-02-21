import { type t, describe, expect, it } from '../-test.ts';
import { toString } from './u.toString.ts';

describe('toString', () => {
  it('empty', () => {
    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((value: any) => expect(toString(value)).to.eql(''));
    expect(toString()).to.eql('');
    expect(toString({})).to.eql('');
  });

  it('{ css-props }', () => {
    const res = toString({
      color: 'rgba(255, 0, 0, 0.1)',
      border: '   solid 1px  ', // NB: trimmed.
    });
    expect(res).to.eql(`color: rgba(255, 0, 0, 0.1); border: solid 1px;`);
  });

  it('excludes pseudo-class children', () => {
    const style: t.CssValue = { color: ' red ', ':hover': { color: 'blue' } };
    const a = toString(style);
    const b = toString(style[':hover']);
    expect(a).to.eql('color: red;');
    expect(b).to.eql('color: blue;');
  });
});
