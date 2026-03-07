import { describe, expect, it } from '../../../../-test.ts';
import { SlugBundleTransformTreeFs } from '../mod.ts';

describe('u.kind.tree-fs/u.policy.file-content', () => {
  it('derives file-content docs/entries/index and assets targets from in-memory files', async () => {
    const res = await SlugBundleTransformTreeFs.derive({
      includePath: true,
      manifests: ['out/slug-tree.kb.json', 'out/slug-tree.kb.yaml'],
      files: [
        {
          path: './a.md',
          source: `---\nref: crdt:tbd\n---\nhello`,
        },
        {
          path: 'sub/c.md',
          source: `---\nref: crdt:sub\ntitle: Hello\n---\nworld`,
        },
      ],
    });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;

    expect(res.value.docid).to.eql('kb');
    expect(res.value.assetsTargets).to.eql(['out/slug-tree.kb.assets.json']);
    expect(res.value.docs.length).to.eql(2);
    expect(res.value.entries.length).to.eql(2);
    expect(res.value.sha256.length).to.eql(2);
    expect(res.value.index?.docid).to.eql('kb');
    expect(res.value.index?.entries.length).to.eql(2);

    const a = res.value.docs.find((d) => d.path === 'a.md');
    const c = res.value.docs.find((d) => d.path === 'sub/c.md');
    expect(a?.contentType).to.eql('text/markdown');
    expect(a?.frontmatter.ref).to.eql('crdt:tbd');
    expect(c?.frontmatter.ref).to.eql('crdt:sub');
    expect(c?.frontmatter.title).to.eql('Hello');
    expect(res.value.sha256.every((d) => d.filename.endsWith('.json'))).to.eql(true);
  });

  it('honors explicit docid over manifest filename derivation', async () => {
    const res = await SlugBundleTransformTreeFs.derive({
      docid: 'explicit-kb',
      manifests: 'out/slug-tree.kb.json',
      files: [{ path: 'a.md', source: `---\nref: crdt:tbd\n---\nhello` }],
    });
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.value.docid).to.eql('explicit-kb');
    expect(res.value.index?.docid).to.eql('explicit-kb');
  });

  it('returns ok without index when docid is unresolved', async () => {
    const res = await SlugBundleTransformTreeFs.derive({
      manifests: 'out/kb.json',
      files: [{ path: 'a.md', source: `---\nref: crdt:tbd\n---\nhello` }],
    });
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.value.docid).to.eql(undefined);
    expect(res.value.index).to.eql(undefined);
    expect(res.value.assetsTargets).to.eql(['out/kb.assets.json']);
  });

  it('allows missing frontmatter (empty frontmatter)', async () => {
    const res = await SlugBundleTransformTreeFs.derive({
      files: [{ path: 'a.md', source: 'hello' }],
    });
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.value.docs[0]?.frontmatter).to.eql({});
  });

  it('fails on invalid frontmatter ref type', async () => {
    const res = await SlugBundleTransformTreeFs.derive({
      files: [{ path: 'a.md', source: `---\nref: [bad]\n---\nhello` }],
    });
    expect(res.ok).to.eql(false);
    if (res.ok) return;
    expect(res.error.message).to.contain('Invalid frontmatter ref');
  });

  it('fails on invalid frontmatter title type', async () => {
    const res = await SlugBundleTransformTreeFs.derive({
      files: [{ path: 'a.md', source: `---\nref: crdt:tbd\ntitle: [bad]\n---\nhello` }],
    });
    expect(res.ok).to.eql(false);
    if (res.ok) return;
    expect(res.error.message).to.contain('Invalid frontmatter title');
  });
});
