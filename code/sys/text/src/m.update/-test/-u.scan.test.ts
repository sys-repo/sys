import { describe, expect, it } from '../../-test.ts';
import { TextUpdate } from '../mod.ts';

describe('TextUpdate scan primitives', () => {
  it('detects newline style from the first physical newline', () => {
    expect(TextUpdate.newlineOf('a\nb')).to.eql('\n');
    expect(TextUpdate.newlineOf('a\r\nb')).to.eql('\r\n');
    expect(TextUpdate.newlineOf('abc')).to.eql('\n');
  });

  it('returns no spans for empty text', () => {
    expect(TextUpdate.lineSpans('')).to.eql([]);
  });

  it('scans LF physical lines without a synthetic final empty line', () => {
    expect(TextUpdate.lineSpans('a\nb')).to.eql([
      {
        index: 0,
        text: 'a',
        raw: 'a\n',
        range: { start: 0, end: 2 },
        textRange: { start: 0, end: 1 },
        newline: '\n',
      },
      {
        index: 1,
        text: 'b',
        raw: 'b',
        range: { start: 2, end: 3 },
        textRange: { start: 2, end: 3 },
        newline: '',
      },
    ]);

    expect(TextUpdate.lineSpans('a\n').map((line) => line.text)).to.eql(['a']);
  });

  it('scans CRLF and consecutive blank lines', () => {
    const spans = TextUpdate.lineSpans('a\r\n\r\nb');
    expect(spans.map((line) => [line.text, line.raw, line.newline])).to.eql([
      ['a', 'a\r\n', '\r\n'],
      ['', '\r\n', '\r\n'],
      ['b', 'b', ''],
    ]);
  });

  it('treats bare CR as ordinary text', () => {
    const spans = TextUpdate.lineSpans('a\rb\n');
    expect(spans.map((line) => [line.text, line.newline])).to.eql([['a\rb', '\n']]);
  });
});
