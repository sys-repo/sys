import { describe, expect, it } from '../../-test.ts';
import { TextBlock } from '../mod.ts';
import { D } from './common.ts';

const markers = D.markers;

describe('TextBlock.remove', () => {
  it('removes exactly the detected block and does not clean adjacent blank lines', () => {
    const before = `a\n\n${TextBlock.render({ markers, lines: ['body'] })}\nb`;
    const res = TextBlock.remove({ text: before, markers });
    expect(res.kind).to.eql('remove');
    expect(res.after).to.eql('a\n\n\nb');
    expect(res.changes.map((change) => [change.op, change.label])).to.eql([
      ['delete', 'block:remove'],
    ]);
  });

  it('returns unchanged for missing blocks and invalid for malformed blocks', () => {
    const missing = TextBlock.remove({ text: 'plain', markers });
    expect(missing.kind).to.eql('unchanged');
    expect(missing.after).to.eql('plain');

    const invalid = TextBlock.remove({ text: `${markers.start}\n`, markers });
    expect(invalid.kind).to.eql('invalid');
    expect(invalid.after).to.eql(`${markers.start}\n`);
  });
});
