import { describe, expect, it } from '../../-test.ts';
import { Markdown } from '../mod.ts';
import { requireData, Sample } from './u.fixture.ts';

describe('m.Markdown/stringify', () => {
  it('serializes MDAST back to Markdown text that reparses to the same coarse structure', () => {
    const parsed = requireData(Markdown.parse(Sample.headingAndTaskList));
    const text = requireData(Markdown.stringify(parsed));
    const reparsed = requireData(Markdown.parse(text));

    expect(text).to.contain('# Hello');
    expect(text).to.contain('[x] done');
    expect(reparsed.children.map((node) => node.type)).to.eql(['heading', 'list']);
  });
});
