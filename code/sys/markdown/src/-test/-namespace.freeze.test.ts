import { describe, expect, it } from '../-test.ts';
import { Markdown } from '../mod.ts';

describe('markdown namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      Markdown,
      Markdown.Frontmatter,
      Markdown.Html,
      Markdown.Is,
      Markdown.Source,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
