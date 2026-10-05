import { describe, expect, it } from '../../-test.ts';
import { TextUpdate } from '../mod.ts';

describe('TextUpdate apply primitives', () => {
  it('applies inserts, replacements, and deletes', () => {
    const res = TextUpdate.apply('abc', [
      TextUpdate.insert(0, '1'),
      TextUpdate.replace({ start: 1, end: 2 }, 'B'),
      TextUpdate.delete({ start: 2, end: 3 }),
      TextUpdate.insert(3, 'Z'),
    ]);

    expect(res.ok).to.eql(true);
    expect(res.changed).to.eql(true);
    expect(res.after).to.eql('1aBZ');
    expect(res.changes.map((change) => change.op)).to.eql([
      'insert',
      'replace',
      'delete',
      'insert',
    ]);
  });

  it('allows adjacent replacements and stable same-offset inserts', () => {
    const res = TextUpdate.apply('abcd', [
      TextUpdate.replace({ start: 0, end: 2 }, 'AB'),
      TextUpdate.insert(2, '-'),
      TextUpdate.insert(2, '+'),
      TextUpdate.replace({ start: 2, end: 4 }, 'CD'),
    ]);

    expect(res.ok).to.eql(true);
    expect(res.after).to.eql('AB-+CD');
  });

  it('orders inserts at replacement start before replacement and end after replacement', () => {
    const res = TextUpdate.apply('abcd', [
      TextUpdate.insert(1, '<'),
      TextUpdate.replace({ start: 1, end: 3 }, 'BC'),
      TextUpdate.insert(3, '>'),
    ]);

    expect(res.ok).to.eql(true);
    expect(res.after).to.eql('a<BC>d');
  });

  it('omits unchanged replacements from changes', () => {
    const res = TextUpdate.apply('abc', [TextUpdate.replace({ start: 1, end: 2 }, 'b')]);

    expect(res.ok).to.eql(true);
    expect(res.changed).to.eql(false);
    expect(res.after).to.eql('abc');
    expect(res.changes).to.eql([]);
  });

  it('snapshots builder and applied change ranges', () => {
    const range = { start: 1, end: 2 };
    const edit = TextUpdate.replace(range, 'B');
    range.start = 0;
    range.end = 3;

    const res = TextUpdate.apply('abc', [edit]);
    expect(res.ok).to.eql(true);
    expect(res.after).to.eql('aBc');

    (edit.range as { start: number; end: number }).start = 0;
    (edit.range as { start: number; end: number }).end = 3;
    expect(res.changes[0].range).to.eql({ start: 1, end: 2 });
  });

  it('fails safely for invalid ranges and overlapping edits', () => {
    const invalidRange = TextUpdate.apply('abc', [
      TextUpdate.replace({ start: 3, end: 2 }, 'x'),
    ]);
    expect(invalidRange.ok).to.eql(false);
    expect(invalidRange.after).to.eql('abc');
    if (invalidRange.ok) throw new Error('expected invalid range');
    expect(invalidRange.error.reason).to.eql('invalid-range');

    const nonInteger = TextUpdate.apply('abc', [TextUpdate.insert(1.5, 'x')]);
    expect(nonInteger.ok).to.eql(false);
    expect(nonInteger.after).to.eql('abc');
    if (nonInteger.ok) throw new Error('expected non-integer offset failure');
    expect(nonInteger.error.reason).to.eql('invalid-range');

    const malformed = TextUpdate.apply('abc', [{} as never]);
    expect(malformed.ok).to.eql(false);
    expect(malformed.after).to.eql('abc');
    if (malformed.ok) throw new Error('expected malformed edit failure');
    expect(malformed.error.reason).to.eql('invalid-range');

    const overlap = TextUpdate.apply('abc', [
      TextUpdate.replace({ start: 0, end: 2 }, 'x'),
      TextUpdate.replace({ start: 1, end: 3 }, 'y'),
    ]);
    expect(overlap.ok).to.eql(false);
    expect(overlap.after).to.eql('abc');
    if (overlap.ok) throw new Error('expected overlap');
    expect(overlap.error.reason).to.eql('overlapping-edits');
  });

  it('rejects inserts inside replacement ranges', () => {
    const res = TextUpdate.apply('abcd', [
      TextUpdate.replace({ start: 1, end: 3 }, 'BC'),
      TextUpdate.insert(2, '!'),
    ]);

    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('expected invalid insert');
    expect(res.error.reason).to.eql('overlapping-edits');
    expect(res.after).to.eql('abcd');
  });

  it('rejects ranges and inserts that split surrogate pairs', () => {
    const text = 'a👋b';
    const replace = TextUpdate.apply(text, [TextUpdate.replace({ start: 2, end: 3 }, 'x')]);
    expect(replace.ok).to.eql(false);
    if (replace.ok) throw new Error('expected split range');
    expect(replace.error.reason).to.eql('split-surrogate-pair');

    const insert = TextUpdate.apply(text, [TextUpdate.insert(2, 'x')]);
    expect(insert.ok).to.eql(false);
    if (insert.ok) throw new Error('expected split insert');
    expect(insert.error.reason).to.eql('split-surrogate-pair');
  });
});
