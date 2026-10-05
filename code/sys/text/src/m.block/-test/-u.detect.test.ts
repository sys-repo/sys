import { describe, expect, it } from '../../-test.ts';
import { TextBlock } from '../mod.ts';
import { D } from './common.ts';

const markers = D.markers;

describe('TextBlock.detect', () => {
  it('detects missing and present exact-marker blocks', () => {
    expect(TextBlock.detect({ text: '', markers })).to.eql({ kind: 'missing' });
    expect(TextBlock.detect({ text: 'alpha\nbeta', markers })).to.eql({ kind: 'missing' });

    const text = `pre\n${markers.start}\nbody\n${markers.end}\npost`;
    const state = TextBlock.detect({ text, markers });
    if (state.kind !== 'present') throw new Error('expected present block');

    expect(text.slice(state.range.start, state.range.end)).to.eql(state.block);
    expect(text.slice(state.contentRange.start, state.contentRange.end)).to.eql('body\n');
    expect(state.block).to.eql(`${markers.start}\nbody\n${markers.end}\n`);
    expect(state.content).to.eql('body\n');
    expect(state.newline).to.eql('\n');
  });

  it('detects CRLF block newline from physical spans', () => {
    const text = `pre\r\n${markers.start}\r\nbody\r\n${markers.end}\r\npost`;
    const state = TextBlock.detect({ text, markers });
    if (state.kind !== 'present') throw new Error('expected present block');
    expect(state.newline).to.eql('\r\n');
    expect(state.content).to.eql('body\r\n');
  });

  it('fails safely for partial, duplicate, reversed, and malformed markers', () => {
    const partial = TextBlock.detect({ text: `${markers.start}\nbody\n`, markers });
    expect(partial.kind).to.eql('invalid');
    if (partial.kind !== 'invalid') throw new Error('expected invalid partial block');
    expect(partial.reason).to.eql('partial-markers');

    const duplicate = TextBlock.detect({
      text: `${markers.start}\n${markers.start}\n${markers.end}\n`,
      markers,
    });
    expect(duplicate.kind).to.eql('invalid');
    if (duplicate.kind !== 'invalid') throw new Error('expected duplicate invalid block');
    expect(duplicate.reason).to.eql('multiple-blocks');

    const reversed = TextBlock.detect({ text: `${markers.end}\n${markers.start}\n`, markers });
    expect(reversed.kind).to.eql('invalid');
    if (reversed.kind !== 'invalid') throw new Error('expected reversed invalid block');
    expect(reversed.reason).to.eql('reversed-markers');

    const malformed = TextBlock.detect({
      text: '',
      markers: { start: '# >>> bad\n', end: '# <<< bad' },
    });
    expect(malformed.kind).to.eql('invalid');
    if (malformed.kind !== 'invalid') throw new Error('expected malformed markers');
    expect(malformed.reason).to.eql('invalid-markers');
  });

  it('matches marker lines exactly without trimming', () => {
    const text = ` ${markers.start}\nbody\n${markers.end} \n`;
    const state = TextBlock.detect({ text, markers });
    expect(state.kind).to.eql('missing');
  });
});
