import { describe, expect, it } from '../../../-test.ts';
import { Err, Markdown, type t } from '../common.ts';
import { fromParsed, parseLabel } from '../u.parse.ts';

const text = (value: string): t.LabelInline => ({ kind: 'text', value });
const code = (value: string): t.LabelInline => ({ kind: 'code', value });
const strong = (...children: t.LabelInline[]): t.LabelInline => ({ kind: 'strong', children });
const em = (...children: t.LabelInline[]): t.LabelInline => ({ kind: 'emphasis', children });

describe('Text.Label: inline subset and literal recovery', () => {
  it('supported content → recursive, React-independent subset', () => {
    expect(parseLabel('Run **bold *and `code`***.')).to.eql([
      text('Run '),
      strong(text('bold '), em(text('and '), code('code'))),
      text('.'),
    ]);
    expect(parseLabel('`one``two`')).to.eql([code('one``two')]);
    expect(parseLabel('`one` `two`')).to.eql([code('one'), text(' '), code('two')]);
  });

  it('local rejection → supported siblings and enclosing emphasis survive', () => {
    expect(parseLabel('**Save** [help](/help)')).to.eql([
      strong(text('Save')),
      text(' '),
      text('[help](/help)'),
    ]);
    expect(parseLabel('Run **build** &amp; ship [help](/help)')).to.eql([
      text('Run '),
      strong(text('build')),
      text(' & ship '),
      text('[help](/help)'),
    ]);
    expect(parseLabel('*[help](/help)*')).to.eql([em(text('[help](/help)'))]);
    expect(parseLabel('[**help**](/help)')).to.eql([text('[**help**](/help)')]);
  });

  it('unsupported spans → exact authored source, atomically and in order', () => {
    const values = [
      '[**help &amp; `code`**](/help "title")',
      '![*alt* &amp; `code`](/image.png)',
      '<https://example.com>',
      '<person@example.com>',
      '<img src=x onerror="bad()">',
    ];
    for (const value of values) expect(parseLabel(value), value).to.eql([text(value)]);
    expect(parseLabel('🐷 café **Save** [a](/x)[a](/x) ![b](/y)')).to.eql([
      text('🐷 café '),
      strong(text('Save')),
      text(' '),
      text('[a](/x)'),
      text('[a](/x)'),
      text(' '),
      text('![b](/y)'),
    ]);
  });

  it('inline HTML nodes → literal tags, independently supported siblings', () => {
    expect(parseLabel('**Save** <span>**go** &amp;</span>')).to.eql([
      strong(text('Save')),
      text(' '),
      text('<span>'),
      strong(text('go')),
      text(' &'),
      text('</span>'),
    ]);
  });

  it('entities, escapes and unmatched syntax → parser semantics, no second repair pass', () => {
    expect(parseLabel('Fish &amp; chips \\*literal\\* \\`code\\`')).to.eql([
      text('Fish & chips *literal* `code`'),
    ]);
    expect(parseLabel('**open and `unfinished')).to.eql([text('**open and `unfinished')]);
    expect(parseLabel('~~not GFM~~')).to.eql([text('~~not GFM~~')]);
    expect(parseLabel('`` a ` b ``')).to.eql([code('a ` b')]);
    expect(parseLabel('`  `')).to.eql([code('  ')]);
  });

  it('LF/CRLF code and soft newlines → exact parser-owned values', () => {
    // Explicit line-ending bytes are the contract, not authored multiline prose.
    expect(parseLabel('`one\ntwo`')).to.eql([code('one\ntwo')]);
    expect(parseLabel('`one\r\ntwo`')).to.eql([code('one\r\ntwo')]);
    expect(parseLabel('one\r\ntwo')).to.eql([text('one\r\ntwo')]);
    expect(parseLabel('one\ntwo')).to.eql([text('one\ntwo')]);
    expect(parseLabel('🐷\r\n**Save** [a](/x)')).to.eql([
      text('🐷\r\n'),
      strong(text('Save')),
      text(' '),
      text('[a](/x)'),
    ]);
  });

  it('hard breaks → original span, never a synthesized line-break element', () => {
    expect(parseLabel('a  \nb')).to.eql([text('a'), text('  \n'), text('b')]);
    expect(parseLabel('a\\\r\nb')).to.eql([text('a'), text('\\\r\n'), text('b')]);
  });

  it('empty and whitespace-only → literal empty/whitespace without a placeholder', () => {
    for (const value of ['', ' ', '\t', '\r\n  \n']) {
      expect(parseLabel(value)).to.eql([text(value)]);
    }
  });

  it('non-paragraph or multiple-root documents → whole-input fallback without dropped definitions', () => {
    const values = [
      '# **Heading**',
      '- **item**',
      '1. **item**',
      '> **quote**',
      '---',
      '```ts\ncode\n```',
      '<div>**block**</div>',
      'one\n\ntwo',
      '[help][id]\n\n[id]: /help',
      '[id]: /help\n\n**Save**',
      '[id]: /help',
      '---\nname: sample\n---\n**Save**',
      '# ',
      '- ',
      '1. ',
    ];
    for (const value of values) expect(parseLabel(value), value).to.eql([text(value)]);
    expect(parseLabel('**Save** [undefined][id]')).to.eql([
      strong(text('Save')),
      text(' [undefined][id]'),
    ]);
  });

  it('failed recovery inside supported formatting → whole-input, not partial fallback', () => {
    const value = '**Save [help](/help)**';
    const parsed = Markdown.parse(value, { flavor: 'commonmark' });
    if (!parsed.data) throw new Error('Expected parsed fixture.');
    const paragraph = parsed.data.children[0];
    if (paragraph.type !== 'paragraph') throw new Error('Expected paragraph.');
    const strong = paragraph.children[0];
    if (strong.type !== 'strong') throw new Error('Expected strong.');
    const children = strong.children.map((node) => ({ ...node, position: undefined }));
    const data: t.Markdown.Ast = {
      ...parsed.data,
      children: [{ ...paragraph, children: [{ ...strong, children }] }],
    };
    expect(fromParsed(value, { data })).to.eql([text(value)]);
  });

  it('parse error → whole original source', () => {
    const value = '**Save** [help](/help)';
    expect(fromParsed(value, { error: Err.std('Parser failure') })).to.eql([text(value)]);
  });

  it('missing, empty, out-of-bounds and overlapping spans → whole-input fallback', () => {
    const value = '**Save** [help](/help)';
    const parsed = Markdown.parse(value, { flavor: 'commonmark' });
    if (!parsed.data) throw new Error('Expected parsed fixture.');
    const paragraph = parsed.data.children[0];
    if (paragraph.type !== 'paragraph') throw new Error('Expected paragraph fixture.');
    const link = paragraph.children[2];
    if (!link.position) throw new Error('Expected source position.');
    const { start, end } = link.position;
    const positions = [
      undefined,
      { start, end: start },
      { start: { ...start, offset: -1 }, end },
      { start, end: { ...end, offset: value.length + 1 } },
      { start: end, end: start },
      { start: { ...start, offset: 0 }, end },
      { start: { ...start, offset: 9.5 }, end },
    ];
    for (const position of positions) {
      const children = paragraph.children.map((node, index) => {
        return index === 2 ? { ...node, position } : node;
      });
      const data: t.Markdown.Ast = { ...parsed.data, children: [{ ...paragraph, children }] };
      expect(fromParsed(value, { data })).to.eql([text(value)]);
    }
  });
});
