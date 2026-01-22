import { describe, expect, it, type t } from '../../../-test.ts';
import { SlugTreeSchema } from '../mod.ts';
import { validate } from '../u.validate.ts';

describe('SlugTree.validate', () => {
  const VALID_TREE: t.SlugTreeItems = [
    {
      slug: 'Root',
      slugs: [
        { slug: 'Intro', ref: 'crdt:intro' },
        {
          slug: 'Nested',
          description: 'Nested inline node description',
          traits: [{ of: 'slug-tree', as: 'child-tree' }],
          data: { 'child-tree': [{ slug: 'Child' }] },
        },
      ],
    },
    {
      slug: 'RefBranch',
      ref: 'crdt:branch',
      slugs: [{ slug: 'Leaf', ref: 'crdt:leaf' }],
    },
  ];

  const TREE_WITH_UNKNOWN_TRAIT: t.SlugTreeItems = [
    {
      slug: 'Root',
      traits: [{ of: 'not-a-thing', as: 'foo' }],
      data: { foo: [{ slug: 'Child' }] },
    },
  ];

  const TREE_WITH_DUPLICATE_ALIAS: t.SlugTreeItems = [
    {
      slug: 'Root',
      traits: [
        { of: 'slug-tree', as: 'child' },
        { of: 'slug-tree', as: 'child' },
      ],
      data: { child: [{ slug: 'Child' }] },
    },
  ];

  const TREE_WITH_ORPHAN_DATA: t.SlugTreeItems = [
    {
      slug: 'Root',
      traits: [{ of: 'slug-tree', as: 'child' }],
      data: { child: [{ slug: 'Child' }], orphan: { slug: 'Ghost', traits: [] } },
    },
  ];

  const TREE_WITHOUT_SLUG = [
    {
      ref: 'crdt:missing',
    },
  ];

  const TREE_REF_WITH_DESCRIPTION: t.SlugTreeItems = [
    { slug: 'BadRef', ref: 'crdt:bad', description: 'illegal' },
  ];

  it('API', () => {
    expect(SlugTreeSchema.validate).to.equal(validate);
  });

  it('accepts a valid slug-tree payload', () => {
    const result = validate(VALID_TREE);
    expect(result.ok).to.eql(true);
  });

  it('flags unknown trait ids', () => {
    const result = validate(TREE_WITH_UNKNOWN_TRAIT);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('Unknown trait id');
  });

  it('flags duplicate trait aliases', () => {
    const result = validate(TREE_WITH_DUPLICATE_ALIAS);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('Duplicate trait alias');
  });

  it('flags orphan data when no matching alias exists', () => {
    const result = validate(TREE_WITH_ORPHAN_DATA);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('Orphan data');
  });

  it('rejects schema mismatches for invalid nodes', () => {
    const result = validate(TREE_WITHOUT_SLUG);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('Invalid slug-tree item at index 0');
  });

  it('rejects ref nodes that carry inline-only fields', () => {
    const result = validate(TREE_REF_WITH_DESCRIPTION);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('does not conform to slug-tree schema');
  });

  it('accepts ref nodes with nested slugs', () => {
    const tree: t.SlugTreeItems = [
      {
        slug: 'Branch',
        ref: 'crdt:branch',
        slugs: [{ slug: 'Child', ref: 'crdt:child' }],
      },
    ];
    const result = validate(tree);
    expect(result.ok).to.eql(true);
  });

  it('rejects ref nodes with unknown additional keys', () => {
    const tree: t.SlugTreeItems = [
      // @ts-expect-error: extra key
      { slug: 'Bad', ref: 'crdt:bad', foo: 'bar' },
    ];
    const result = validate(tree);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('does not conform to slug-tree schema');
  });
});
