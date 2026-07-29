import { describe, expect, it, type t } from '../../-test.ts';
import { Markdown } from '../mod.ts';
import { requireData } from './u.fixture.ts';

describe('Markdown.Source', () => {
  it('slices exact node source from validated offsets', () => {
    const source: t.StringMarkdown = '# Hello\n';
    expect(Markdown.Source.slice(source, firstNode(source))).to.eql('# Hello');
  });

  it('extracts marker facts from CommonMark-parsed thematic breaks', () => {
    // `Markdown.parse` is grammar authority. These are CommonMark spellings, not a sys DSL.
    const cases = [
      { source: '---\n', expected: { raw: '---', marker: '-', count: 3, spaced: false } },
      { source: '- - -\n', expected: { raw: '- - -', marker: '-', count: 3, spaced: true } },
      { source: '-  - - -\n', expected: { raw: '-  - - -', marker: '-', count: 4, spaced: true } },
      { source: '******\n', expected: { raw: '******', marker: '*', count: 6, spaced: false } },
      { source: '_ _ _ _\n', expected: { raw: '_ _ _ _', marker: '_', count: 4, spaced: true } },
      { source: '*\t*\t*\n', expected: { raw: '*\t*\t*', marker: '*', count: 3, spaced: true } },
    ] as const;

    cases.forEach(({ source, expected }) => {
      const node = firstNode(source);
      expect(node.type).to.eql('thematicBreak');
      if (node.type !== 'thematicBreak') throw new Error('Expected a parsed thematic break.');

      const lexeme = Markdown.Source.thematicBreak(source, node);
      expect(lexeme?.raw).to.eql(expected.raw);
      expect(lexeme?.marker).to.eql(expected.marker);
      expect(lexeme?.count).to.eql(expected.count);
      expect(lexeme?.spaced).to.eql(expected.spaced);
      expect(lexeme?.position).to.equal(node.position);
    });
  });

  it('ignores whitespace outside the first and last marker', () => {
    const source: t.StringMarkdown = '  ---  \n';
    const node = firstNode(source);
    if (!node.position) throw new Error('Expected a positioned thematic break.');

    const positioned = {
      ...node,
      position: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 8, offset: 7 },
      },
    } as t.Markdown.Node;
    const lexeme = Markdown.Source.thematicBreak(source, positioned);

    expect(lexeme?.raw).to.eql('  ---  ');
    expect(lexeme?.spaced).to.eql(false);
  });

  it('uses JS source offsets with preceding astral characters', () => {
    const source: t.StringMarkdown = '😀 before\n\n---\n';
    const node = parse(source).children[1];
    if (!node) throw new Error('Expected a thematic-break node.');

    expect(Markdown.Source.slice(source, node)).to.eql('---');
    expect(Markdown.Source.thematicBreak(source, node)?.raw).to.eql('---');
  });

  it('uses stripped frontmatter body source for body-node offsets', () => {
    const source: t.StringMarkdown = '---\ntitle: Hello\n---\n\n* * *\n';
    const doc = requireData(Markdown.Frontmatter.parse(source));
    const node = doc.ast.children[0];
    if (!node) throw new Error('Expected a thematic-break node.');

    expect(Markdown.Source.thematicBreak(doc.markdown, node)?.raw).to.eql('* * *');
    // Body offsets are relative to `doc.markdown`; the original source is intentionally rejected.
    expect(Markdown.Source.thematicBreak(source, node)).to.eql(undefined);
  });

  it('returns undefined instead of guessing from invalid or mismatched nodes', () => {
    const source: t.StringMarkdown = '---\n';
    const thematicBreak = firstNode(source);
    const heading = firstNode('# Heading\n');
    const invalid = {
      ...thematicBreak,
      position: {
        start: { line: 1, column: 1, offset: -1 },
        end: { line: 1, column: 4, offset: 3 },
      },
    } as t.Markdown.Node;
    const outOfRange = {
      ...thematicBreak,
      position: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 100, offset: 99 },
      },
    } as t.Markdown.Node;

    expect(Markdown.Source.thematicBreak(source, heading)).to.eql(undefined);
    expect(Markdown.Source.slice(source, invalid)).to.eql(undefined);
    expect(Markdown.Source.thematicBreak(source, invalid)).to.eql(undefined);
    expect(Markdown.Source.slice(source, outOfRange)).to.eql(undefined);
    expect(Markdown.Source.thematicBreak(source, outOfRange)).to.eql(undefined);
  });
});

/**
 * Helpers:
 */
const parse = (source: t.StringMarkdown) => requireData(Markdown.parse(source));

function firstNode(source: t.StringMarkdown): t.Markdown.Node {
  const node = parse(source).children[0];
  if (!node) throw new Error('Expected a Markdown node.');
  return node;
}
