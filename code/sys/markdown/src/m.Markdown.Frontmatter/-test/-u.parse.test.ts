import { describe, expect, it } from '../../-test.ts';
import { Frontmatter } from '../mod.ts';
import { requireData, Sample } from './u.fixture.ts';

type Meta = {
  readonly title: string;
  readonly tags: readonly string[];
};

describe('Markdown.Frontmatter.parse', () => {
  it('parses YAML frontmatter with @sys/yaml and strips the Markdown body', () => {
    const doc = requireData(Frontmatter.parse<Meta>(Sample.yamlFrontmatter));

    expect(doc.frontmatter?.format).to.eql('yaml');
    expect(doc.frontmatter?.raw).to.contain('title: Hello');
    expect(doc.frontmatter?.data?.title).to.eql('Hello');
    expect(doc.frontmatter?.data?.tags).to.eql(['markdown', 'sys']);
    expect(doc.markdown).to.eql('# Hello\n\n- [x] done\n');
  });

  it('parses the stripped Markdown body into MDAST with GFM as the default flavor', () => {
    const doc = requireData(Frontmatter.parse(Sample.yamlFrontmatter));

    expect(doc.ast.children.map((node) => node.type)).to.eql(['heading', 'list']);
    const list = doc.ast.children[1];
    expect(list?.type).to.eql('list');
    if (list?.type === 'list') expect(list.children[0]?.checked).to.eql(true);
  });

  it('allows explicit CommonMark body parsing', () => {
    const doc = requireData(Frontmatter.parse(Sample.yamlFrontmatterWithTable, {
      flavor: 'commonmark',
    }));

    expect(doc.ast.children.map((node) => node.type)).to.eql(['paragraph']);
  });

  it('succeeds when no frontmatter is present', () => {
    const doc = requireData(Frontmatter.parse(Sample.noFrontmatter));

    expect(doc.frontmatter).to.eql(undefined);
    expect(doc.markdown).to.eql(Sample.noFrontmatter);
    expect(doc.ast.children.map((node) => node.type)).to.eql(['heading', 'list']);
  });
});
