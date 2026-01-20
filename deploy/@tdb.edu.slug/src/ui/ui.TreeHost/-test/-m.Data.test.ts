import { type t, describe, it, expect } from '../../../-test.ts';
import { Data } from '../m.Data.ts';

const REF_NODE: t.SlugTreeItem = { slug: 'ref-node', ref: 'slug://ref' };
const INLINE_NODE: t.SlugTreeItem = {
  slug: 'inline-node',
  description: 'Inline description',
  traits: [{ of: 'media', as: 'sequence' }],
  data: { foo: 'bar' },
};

describe('Data.fromSlugTree', () => {
  it('returns empty list for empty slug-tree', () => {
    const res = Data.fromSlugTree([]);
    expect(res).to.eql([]);
  });

  it('preserves sibling order', () => {
    const tree: t.SlugTreeItems = [{ slug: 'first' }, { slug: 'second' }];
    const res = Data.fromSlugTree(tree);
    expect(res.map((node) => node.path)).to.eql([['first'], ['second']]);
  });

  it('produces deterministic path and key', () => {
    const tree: t.SlugTreeItems = [{ slug: 'one', slugs: [{ slug: 'two' }] }];
    const resA = Data.fromSlugTree(tree);
    const resB = Data.fromSlugTree(tree);
    expect(resA[0].path).to.eql(['one']);
    expect(resA[0].children?.[0].path).to.eql(['one', 'two']);
    expect(resA[0].key).to.be.a('string');
    expect(resB[0].key).to.eql(resA[0].key);
  });

  it('honors label modes', () => {
    const tree: t.SlugTreeItems = [{ slug: 'plain' }, { slug: 'described', description: 'cool' }];
    const plain = Data.fromSlugTree(tree)[0];
    expect(plain.label).to.eql('plain');
    const described = Data.fromSlugTree(tree, { label: 'slug+description' })[1];
    expect(described.label).to.eql('described — cool');
    const fallback = Data.fromSlugTree([{ slug: 'solo' }], { label: 'slug+description' })[0];
    expect(fallback.label).to.eql('solo');
  });

  it('value carries domain payload', () => {
    const tree: t.SlugTreeItems = [INLINE_NODE, REF_NODE];
    const [inline, ref] = Data.fromSlugTree(tree);
    const inlineValue = inline.value as {
      slug: string;
      description?: string;
      traits?: readonly t.SlugTrait[];
      data?: (typeof INLINE_NODE)['data'];
    };
    const refValue = ref.value as { slug: string; ref?: string };
    expect(inlineValue.slug).to.eql(INLINE_NODE.slug);
    expect(inlineValue.description).to.eql(INLINE_NODE.description);
    expect(inlineValue.traits).to.eql(INLINE_NODE.traits);
    expect(inlineValue.data).to.eql(INLINE_NODE.data);
    expect(refValue.ref).to.eql(REF_NODE.ref);
  });

  it('propagates inline descriptions to node metadata', () => {
    const tree: t.SlugTreeItems = [{ slug: 'desc', description: 'inline description' }];
    const node = Data.fromSlugTree(tree)[0];
    expect(node.meta?.description).to.eql('inline description');
  });

  it('omits data when payload is not a record', () => {
    const weird = { slug: 'weird', data: 123 } as unknown as t.SlugTreeItem;
    const res = Data.fromSlugTree([weird]);
    expect(res[0].value).to.not.have.property('data');
  });

  it('maps children when slugs present and removes when absent', () => {
    const tree: t.SlugTreeItems = [
      { slug: 'parent', slugs: [{ slug: 'child' }] },
      { slug: 'solo' },
    ];
    const res = Data.fromSlugTree(tree);
    expect(res[0].children).to.have.length(1);
    expect(res[1].children).to.be.undefined;
  });
});
