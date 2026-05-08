import { describe, expect, it } from '../../-test.ts';
import { TextUpdate } from '../mod.ts';

describe('TextUpdate.lines', () => {
  const sample = () => 'line-1\nline-2\nline-3\n';

  it('no change without visitor preserves text exactly', () => {
    const text = 'line-1';
    const res = TextUpdate.lines(text);

    expect(res.ok).to.eql(true);
    expect(res.changed).to.eql(false);
    expect(res.changes).to.eql([]);
    expect(res.before).to.eql(text);
    expect(res.after).to.eql(text);
  });

  it('no change when replace returns same value', () => {
    const res = TextUpdate.lines(sample(), (line) => line.replace(line.text));

    expect(res.ok).to.eql(true);
    expect(res.changed).to.eql(false);
    expect(res.changes).to.eql([]);
  });

  it('replaces, inserts, and deletes lines functionally', () => {
    const res = TextUpdate.lines(sample(), (line) => {
      if (line.text === 'line-1') return line.insertBefore('head');
      if (line.text === 'line-2') return line.replace('line-2 updated');
      if (line.text === 'line-3') return [line.insertAfter('tail'), line.delete()];
    }, { eof: 'ensure' });

    expect(res.ok).to.eql(true);
    expect(res.after).to.eql('head\nline-1\nline-2 updated\ntail\n');
    expect(res.changes.map((change) => change.op)).to.eql([
      'insert',
      'replace',
      'delete',
      'insert',
    ]);
  });

  it('does not revisit inserted lines in the same pass', () => {
    const seen: string[] = [];
    const res = TextUpdate.lines('a\nb', (line) => {
      seen.push(line.text);
      if (line.text === 'a') return line.insertAfter('inserted');
      if (line.text === 'inserted') return line.insertAfter('should-not-run');
    });

    expect(res.ok).to.eql(true);
    expect(seen).to.eql(['a', 'b']);
    expect(res.after).to.eql('a\ninserted\nb');
  });

  it('inserts after a final unterminated line with preserve and ensure EOF policies', () => {
    const preserve = TextUpdate.lines('line-1', (line) => {
      if (line.is.last) return line.insertAfter('tail');
    });
    expect(preserve.ok).to.eql(true);
    expect(preserve.after).to.eql('line-1\ntail');

    const ensure = TextUpdate.lines('line-1', (line) => {
      if (line.is.last) return line.insertAfter('tail');
    }, { eof: 'ensure' });
    expect(ensure.ok).to.eql(true);
    expect(ensure.after).to.eql('line-1\ntail\n');
  });

  it('preserves and normalizes newline styles intentionally', () => {
    const preserve = TextUpdate.lines('a\r\nb\r\n', (line) => {
      if (line.text === 'a') return line.insertAfter('x');
    });
    expect(preserve.ok).to.eql(true);
    expect(preserve.after).to.eql('a\r\nx\r\nb\r\n');

    const lf = TextUpdate.lines('a\r\nb\r\n', undefined, { newline: '\n' });
    expect(lf.ok).to.eql(true);
    expect(lf.after).to.eql('a\nb\n');
  });

  it('supports EOF ensure and strip policies', () => {
    const ensure = TextUpdate.lines('a', undefined, { eof: 'ensure' });
    expect(ensure.ok).to.eql(true);
    expect(ensure.after).to.eql('a\n');

    const strip = TextUpdate.lines('a\n', undefined, { eof: 'strip' });
    expect(strip.ok).to.eql(true);
    expect(strip.after).to.eql('a');
  });

  it('reports EOF normalization from empty text as an insert', () => {
    const res = TextUpdate.lines('', undefined, { eof: 'ensure' });

    expect(res.ok).to.eql(true);
    expect(res.after).to.eql('\n');
    expect(res.changes.map((change) => [change.op, change.label])).to.eql([
      ['insert', 'normalize'],
    ]);
  });

  it('fails safely for invalid logical line text and malformed visitor edits', () => {
    const invalidText = TextUpdate.lines('a\n', (line) => line.replace('x\ny'));

    expect(invalidText.ok).to.eql(false);
    expect(invalidText.after).to.eql('a\n');
    if (invalidText.ok) throw new Error('expected invalid line text');
    expect(invalidText.error.reason).to.eql('invalid-line-text');

    const malformed = TextUpdate.lines('a\n', () => ({} as never));
    expect(malformed.ok).to.eql(false);
    expect(malformed.after).to.eql('a\n');
    if (malformed.ok) throw new Error('expected malformed visitor edit');
    expect(malformed.error.reason).to.eql('invalid-range');
  });

  it('exposes immutable original line snapshots', () => {
    const seen: (readonly string[])[] = [];
    TextUpdate.lines(sample(), (line) => {
      if (line.text === 'line-1') {
        seen.push(line.lines);
        seen.push(line.lines);
        return line.insertAfter('inserted');
      }
      if (line.text === 'line-2') seen.push(line.lines);
    });

    expect(seen[0]).to.equal(seen[1]);
    expect(seen[2]).to.equal(seen[0]);
    expect(seen[0]).to.eql(['line-1', 'line-2', 'line-3']);
  });

  it('keeps original line snapshots stable across visitor mutation attempts', () => {
    const seen: (readonly string[])[] = [];
    TextUpdate.lines('a\nb', (line) => {
      seen.push(line.lines);
      try {
        (line.lines as string[]).push('mutated');
      } catch {
        // Frozen at runtime; snapshot remains stable for subsequent visitors.
      }
    });

    expect(seen.map((lines) => [...lines])).to.eql([
      ['a', 'b'],
      ['a', 'b'],
    ]);
  });

  it('keeps helper ranges stable across visitor mutation attempts', () => {
    const res = TextUpdate.lines('a\nb', (line) => {
      if (line.text !== 'a') return;
      (line.range as { start: number }).start = 100;
      return line.delete();
    });

    expect(res.ok).to.eql(true);
    expect(res.after).to.eql('b');
  });
});
