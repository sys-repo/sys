import { describe, expect, it } from '../../-test.ts';
import { Markdown } from '../mod.ts';
import { requireData, Sample } from './u.fixture.ts';

describe('Markdown.stringify', () => {
  it('serializes MDAST back to Markdown text that reparses to the same coarse structure', () => {
    const parsed = requireData(Markdown.parse(Sample.headingAndTaskList));
    const text = requireData(Markdown.stringify(parsed));
    const reparsed = requireData(Markdown.parse(text));

    expect(text).to.contain('# Hello');
    expect(text).to.contain('[x] done');
    expect(reparsed.children.map((node) => node.type)).to.eql(['heading', 'list']);
  });

  it('round-trips GFM table cells and a checked task', () => {
    const parsed = requireData(Markdown.parse(Sample.gfmTableAndTaskList));
    const text = requireData(Markdown.stringify(parsed));
    const reparsed = requireData(Markdown.parse(text));
    const [table, list] = reparsed.children;

    expect(reparsed.children.map((node) => node.type)).to.eql(['table', 'list']);
    const rows = table?.type === 'table'
      ? table.children.map((row) =>
        row.children.map((cell) =>
          cell.children.map((node) => node.type === 'text' ? node.value : node.type)
        )
      )
      : undefined;
    expect(rows).to.eql([[['A'], ['B']], [['1'], ['2']]]);

    const tasks = list?.type === 'list' ? list.children : [];
    expect(tasks).to.have.length(1);
    expect(tasks[0]?.checked).to.eql(true);
    const paragraph = tasks[0]?.children[0];
    const label = paragraph?.type === 'paragraph' ? paragraph.children[0] : undefined;
    expect(label?.type === 'text' ? label.value : undefined).to.eql('done');
  });
});
