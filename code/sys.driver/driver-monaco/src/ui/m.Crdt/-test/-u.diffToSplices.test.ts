import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { diffToSplices } from '../u.diffToSplices.ts';

type Splice = { index: number; delCount: number; insertText: string };

const applySplices = (before: string, splices: readonly Splice[]) =>
  splices.reduce((acc, s) => {
    const head = acc.slice(0, s.index);
    const tail = acc.slice(s.index + s.delCount);
    return head + s.insertText + tail;
  }, before);

describe('diffToSplices', () => {
  it('typing: returns Splice[]', () => {
    expectTypeOf(diffToSplices('a', 'a')).toEqualTypeOf<Splice[]>();
  });

  it('no change → empty array', () => {
    const res = diffToSplices('hello', 'hello');
    expect(res).to.eql([]);
  });

  it('pure insert: start', () => {
    const before = '';
    const after = 'abc';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 0, delCount: 0, insertText: 'abc' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('pure insert: middle', () => {
    const before = 'abde';
    const after = 'abcde';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 2, delCount: 0, insertText: 'c' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('pure insert: end', () => {
    const before = 'abc';
    const after = 'abcd';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 3, delCount: 0, insertText: 'd' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('pure delete: start', () => {
    const before = 'abc';
    const after = 'bc';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 0, delCount: 1, insertText: '' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('pure delete: middle', () => {
    const before = 'abcde';
    const after = 'abde';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 2, delCount: 1, insertText: '' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('pure delete: end', () => {
    const before = 'abcd';
    const after = 'abc';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 3, delCount: 1, insertText: '' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('replace: single char in middle', () => {
    const before = 'abXde';
    const after = 'abYde';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 2, delCount: 1, insertText: 'Y' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('replace: expands (1 → many)', () => {
    const before = 'abXde';
    const after = 'abXYZde';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 3, delCount: 0, insertText: 'YZ' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('replace: shrinks (many → 1)', () => {
    const before = 'abXYZde';
    const after = 'abXde';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 3, delCount: 2, insertText: '' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('replace: whole string', () => {
    const before = 'foo';
    const after = 'bar';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 0, delCount: 3, insertText: 'bar' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('to empty string', () => {
    const before = 'abc';
    const after = '';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 0, delCount: 3, insertText: '' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('from empty string', () => {
    const before = '';
    const after = 'abc';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 0, delCount: 0, insertText: 'abc' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('multi-line: insert newline in middle', () => {
    const before = 'hello\nworld';
    const after = 'hello\ncruel\nworld';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 6, delCount: 0, insertText: 'cruel\n' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('non-contiguous edits collapse into one splice (expected behavior)', () => {
    // Two separate logical edits → single covering splice.
    const before = 'abcdef';
    const after = 'abXYeZf'; // cd→XY and inserted Z before final f
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 2, delCount: 3, insertText: 'XYeZ' }]);
    expect(applySplices(before, res)).to.eql(after);
  });

  it('unicode (BMP) behaves as expected', () => {
    const before = 'café';
    const after = 'cafe';
    const res = diffToSplices(before, after);
    expect(res).to.eql([{ index: 3, delCount: 1, insertText: 'e' }]);
    expect(applySplices(before, res)).to.eql(after);
  });
});
