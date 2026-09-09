import { describe, expect, it } from '../../-test.ts';
import { Frontmatter } from '../mod.ts';
import { Sample } from './u.fixture.ts';

describe('Markdown.Frontmatter.errors', () => {
  it('normalizes invalid YAML frontmatter failures', () => {
    const res = Frontmatter.parse(Sample.invalidYamlFrontmatter);

    expect(res.data).to.eql(undefined);
    expect(res.error?.message).to.eql('Failed to parse Markdown frontmatter');
  });

  it('normalizes unclosed YAML frontmatter failures', () => {
    const res = Frontmatter.parse(Sample.unclosedYamlFrontmatter);

    expect(res.data).to.eql(undefined);
    expect(res.error?.message).to.eql('Failed to parse Markdown frontmatter');
  });
});
