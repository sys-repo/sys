import { describe, expect, it, type t } from '../../../-test.ts';
import { Is } from '../m.Is.ts';
import { SlugTreeSchema } from '../mod.ts';

describe('SlugTree.Is', () => {
  it('API', () => {
    expect(SlugTreeSchema.Is).to.equal(Is);
  });

  it('refOnly accepts slug + ref and rejects missing/empty refs', () => {
    const refOnly: t.SlugTreeItemRefOnly = { slug: 'Ref', ref: 'crdt:ref' };
    expect(Is.refOnly(refOnly)).to.eql(true);

    expect(Is.refOnly({ slug: 'Ref' })).to.eql(false);
    expect(Is.refOnly({ slug: 'Ref', ref: '' })).to.eql(false);
  });

  it('inline accepts slug-only nodes and rejects when ref is present', () => {
    const inline: t.SlugTreeItemInline = { slug: 'Inline' };
    expect(Is.inline(inline)).to.eql(true);
    expect(Is.inline({ slug: 'Inline', description: 'desc' })).to.eql(true);
    expect(Is.inline({ slug: 'Inline', ref: 'crdt:ref' })).to.eql(false);
  });

  it('item matches both inline and ref-only and rejects garbage', () => {
    expect(Is.item({ slug: 'Inline' })).to.eql(true);
    expect(Is.item({ slug: 'Ref', ref: 'crdt:ref' })).to.eql(true);
    expect(Is.item({ foo: 'bar' })).to.eql(false);
  });

  it('items matches arrays of valid slugs and rejects invalid entries', () => {
    const list: t.SlugTreeItems = [{ slug: 'Inline' }, { slug: 'Ref', ref: 'crdt:ref' }];
    expect(Is.items(list)).to.eql(true);
    expect(Is.items([{ slug: 'Bad', ref: '' }])).to.eql(false);
    expect(Is.items([{ slug: 'Inline' }, { foo: 'bar' }])).to.eql(false);
  });

  it('items validates nested slugs recursively', () => {
    const nested: t.SlugTreeItemInline = { slug: 'Parent', slugs: [{ slug: 'Child' }] };
    expect(Is.items([nested])).to.eql(true);
    const invalid: t.SlugTreeItemInline = {
      slug: 'Parent',
      slugs: [{ foo: 'bar' } as unknown as t.SlugTreeItem],
    };
    expect(Is.items([invalid])).to.eql(false);
  });
});
