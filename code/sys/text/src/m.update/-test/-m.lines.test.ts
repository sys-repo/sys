import { describe, expect, it, Str } from '../../-test.ts';
import { Update } from '../mod.ts';

describe('Update.lines', () => {
  const sample = () =>
    Str.dedent(`
      line-1
      line-2
      line-3
    `).trimStart();

  it('no change without modifier', () => {
    const text = sample();
    const res = Update.lines(text);

    expect(res.changed).to.eql(false);
    expect(res.changes).to.eql([]);
    expect(res.before).to.eql(`${text}\n`);
    expect(res.after).to.eql(`${text}\n`);
  });

  it('no change when modify returns same value', () => {
    const res = Update.lines(sample(), (line) => line.modify(line.text));

    expect(res.changed).to.eql(false);
    expect(res.changes).to.eql([]);
  });

  it('modifies lines synchronously', () => {
    const res = Update.lines(sample(), (line) => {
      if (line.text === 'line-2') line.modify('line-2 updated');
    });

    expect(res.after.split('\n')).to.eql(['line-1', 'line-2 updated', 'line-3', '']);
    expect(res.changes.map((change) => change.op)).to.eql(['modify']);
  });

  it('inserts before a line', () => {
    const res = Update.lines(sample(), (line) => {
      if (line.text === 'line-2') line.insert('inserted');
    });

    expect(res.after.split('\n')).to.eql(['line-1', 'inserted', 'line-2', 'line-3', '']);
    expect(res.changes.map((change) => change.op)).to.eql(['insert']);
  });

  it('inserts after a line', () => {
    const res = Update.lines(sample(), (line) => {
      if (line.text === 'line-1') line.insert('foo', 'after');
      if (line.text === 'foo') line.insert('bar');
    });

    expect(res.after.split('\n')).to.eql(['line-1', 'bar', 'foo', 'line-2', 'line-3', '']);
    expect(res.changes.map((change) => change.op)).to.eql(['insert', 'insert']);
  });

  it('deletes lines', () => {
    const res = Update.lines(sample(), (line) => {
      if (line.text === 'line-1') line.delete();
      if (line.text === 'line-2') line.modify('line-2 updated');
    });

    expect(res.after.split('\n')).to.eql(['line-2 updated', 'line-3', '']);
    expect(res.changes.map((change) => change.op)).to.eql(['delete', 'modify']);
  });

  it('deletes all lines', () => {
    const res = Update.lines(sample(), (line) => {
      line.delete();
    });

    expect(res.after).to.eql('\n');
    expect(res.changes.map((change) => change.op)).to.eql(['delete', 'delete', 'delete', 'delete']);
  });

  it('returns a fresh line snapshot after insert', () => {
    const seen: (readonly string[])[] = [];

    Update.lines(sample(), (line) => {
      if (line.text === 'line-1') {
        seen.push(line.lines);
        seen.push(line.lines);
      }
      if (line.text === 'line-2') {
        seen.push(line.lines);
        line.insert('inserted');
        seen.push(line.lines);
      }
    });

    expect(seen[0]).to.equal(seen[1]);
    expect(seen[2]).to.not.equal(seen[3]);
    expect(seen[3].length).to.eql(seen[2].length + 1);
  });

  it('normalizes missing trailing newline', () => {
    const res = Update.lines('line-1', (line) => {
      if (line.is.first) line.modify('line-1 updated');
    });

    expect(res.before).to.eql('line-1\n');
    expect(res.after).to.eql('line-1 updated\n');
  });
});
