import { describe, expect, it } from '../../-test.ts';
import { Markdown } from '../mod.ts';
import { requireData, Sample } from './u.fixture.ts';

describe('m.Markdown/parse', () => {
  describe('CommonMark', () => {
    it('parses headings, lists, code fences, and links', () => {
      const ast = requireData(Markdown.parse(Sample.commonmarkDocument, { flavor: 'commonmark' }));

      expect(ast.children.map((node) => node.type)).to.eql([
        'heading',
        'list',
        'code',
        'paragraph',
      ]);

      const heading = ast.children[0];
      expect(heading?.type).to.eql('heading');
      if (heading?.type === 'heading') expect(heading.depth).to.eql(1);

      const paragraph = ast.children[3];
      expect(paragraph?.type).to.eql('paragraph');
      if (paragraph?.type === 'paragraph') expect(paragraph.children[0]?.type).to.eql('link');
    });

    it('keeps GFM tables as plain paragraph text when explicitly requested', () => {
      const ast = requireData(Markdown.parse(Sample.gfmTable, { flavor: 'commonmark' }));

      expect(ast.children.map((node) => node.type)).to.eql(['paragraph']);
    });
  });

  describe('GFM default', () => {
    it('parses tables and task-list items without an option flag', () => {
      const ast = requireData(Markdown.parse(Sample.gfmTableAndTaskList));

      expect(ast.children.map((node) => node.type)).to.eql(['table', 'list']);

      const list = ast.children[1];
      expect(list?.type).to.eql('list');
      if (list?.type === 'list') expect(list.children[0]?.checked).to.eql(true);
    });
  });
});
