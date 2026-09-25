import { describe, expect, it } from '../../-test.ts';
import { TextBlock } from '../mod.ts';
import { D } from './common.ts';

const markers = D.markers;

describe('TextBlock.render', () => {
  it('renders LF and CRLF blocks from logical lines', () => {
    expect(TextBlock.render({ markers, lines: ['a', '', 'b'] })).to.eql(
      `${markers.start}\na\n\nb\n${markers.end}\n`,
    );
    expect(TextBlock.render({ markers, lines: ['a', 'b'], newline: '\r\n' })).to.eql(
      `${markers.start}\r\na\r\nb\r\n${markers.end}\r\n`,
    );
    expect(TextBlock.render({ markers, lines: ['a', ''] })).to.eql(
      `${markers.start}\na\n\n${markers.end}\n`,
    );
  });

  it('separates raw content from the end marker without inventing extra blank lines', () => {
    expect(TextBlock.render({ markers, content: 'body' })).to.eql(
      `${markers.start}\nbody\n${markers.end}\n`,
    );
    expect(TextBlock.render({ markers, content: 'body\n' })).to.eql(
      `${markers.start}\nbody\n${markers.end}\n`,
    );
  });

  it('throws deterministic developer errors for malformed render inputs', () => {
    expect(() => TextBlock.render({ markers: { start: 'same', end: 'same' }, content: '' })).to
      .throw(TypeError);
    expect(() => TextBlock.render({ markers, lines: ['bad\nline'] })).to.throw(TypeError);
  });
});
