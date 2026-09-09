import { describe, expect, it } from '../../-test.ts';
import { TextBlock } from '../mod.ts';
import { D } from './common.ts';

const markers = D.markers;

describe('TextBlock.update', () => {
  it('adds to empty text and appends to existing text without extra blank-line cleanup', () => {
    const block = TextBlock.render({ markers, lines: ['body'] });
    expect(TextBlock.update({ text: '', markers, lines: ['body'] }).after).to.eql(block);
    expect(TextBlock.update({ text: 'alpha', markers, lines: ['body'] }).after).to.eql(
      `alpha\n${block}`,
    );
    expect(TextBlock.update({ text: 'alpha\n', markers, lines: ['body'] }).after).to.eql(
      `alpha\n${block}`,
    );
  });

  it('replaces present blocks through TextUpdate.apply and reports changes', () => {
    const before = `pre\n${TextBlock.render({ markers, lines: ['old'] })}post`;
    const res = TextBlock.update({ text: before, markers, lines: ['new'] });

    expect(res.kind).to.eql('replace');
    expect(res.changed).to.eql(true);
    expect(res.after).to.eql(`pre\n${TextBlock.render({ markers, lines: ['new'] })}post`);
    expect(res.changes.map((change) => [change.op, change.label])).to.eql([
      ['replace', 'block:replace'],
    ]);
  });

  it('returns unchanged when rendered block is already exact', () => {
    const before = TextBlock.render({ markers, lines: ['same'] });
    const res = TextBlock.update({ text: before, markers, lines: ['same'] });
    expect(res.kind).to.eql('unchanged');
    expect(res.changed).to.eql(false);
    expect(res.after).to.eql(before);
    expect(res.changes).to.eql([]);
  });

  it('preserves CRLF by default and supports explicit newline rendering', () => {
    const before = TextBlock.render({ markers, lines: ['old'], newline: '\r\n' });
    const preserved = TextBlock.update({ text: before, markers, lines: ['new'] });
    expect(preserved.after).to.eql(
      TextBlock.render({ markers, lines: ['new'], newline: '\r\n' }),
    );

    const normalized = TextBlock.update({ text: before, markers, lines: ['new'], newline: '\n' });
    expect(normalized.after).to.eql(TextBlock.render({ markers, lines: ['new'], newline: '\n' }));
  });

  it('does not mutate invalid marker states', () => {
    const before = `${markers.start}\nbody\n`;
    const res = TextBlock.update({ text: before, markers, lines: ['new'] });
    expect(res.kind).to.eql('invalid');
    expect(res.changed).to.eql(false);
    expect(res.after).to.eql(before);
    expect(res.changes).to.eql([]);
  });
});
