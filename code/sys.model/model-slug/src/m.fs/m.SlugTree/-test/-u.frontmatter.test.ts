import { describe, expect, it, Str } from '../../../-test.ts';
import { SlugTreeFs } from '../mod.ts';

describe('SlugTreeFs.frontmatter', () => {
  it('inserts front-matter with ref when missing', async () => {
    let count = 0;
    const createCrdt = async () => {
      count += 1;
      return `new-${count}`;
    };

    const res = await SlugTreeFs.ensureFrontmatterRef({
      text: '# Title\n',
      createCrdt,
    });

    expect(res.updated).to.eql(true);
    expect(res.ref).to.eql('crdt:new-1');
    expect(res.text.startsWith('---\nref: crdt:new-1\n---\n')).to.eql(true);
    expect(res.text).to.contain('# Title');
  });

  it('adds ref to existing front-matter without overwriting', async () => {
    const src = Str.dedent(`
      ---
      title: Beta
      ---

      # Beta
    `).trimStart();

    const res = await SlugTreeFs.ensureFrontmatterRef({
      text: src,
      createCrdt: async () => 'crdt:beta-1',
    });

    expect(res.updated).to.eql(true);
    expect(res.ref).to.eql('crdt:beta-1');
    const frontmatter = res.text.split('---')[1];
    expect(frontmatter.trim().startsWith('ref: crdt:beta-1')).to.eql(true);
    expect(frontmatter).to.contain('title: Beta');
  });

  it('leaves existing ref untouched', async () => {
    const src = Str.dedent(`
      ---
      ref: crdt:existing
      title: Gamma
      ---

      # Gamma
    `).trimStart();

    const res = await SlugTreeFs.ensureFrontmatterRef({
      text: src,
      createCrdt: async () => 'crdt:should-not-use',
    });

    expect(res.updated).to.eql(false);
    expect(res.ref).to.eql('crdt:existing');
    expect(res.text).to.eql(src);
  });
});
