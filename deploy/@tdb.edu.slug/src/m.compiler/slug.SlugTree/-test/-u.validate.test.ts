import { describe, expect, it, type t } from '../../-test.ts';
import { validateSlugTree } from '../u.validate.ts';

const VALID_TREE: t.SlugTreeProps = [
  {
    slug: 'Root',
    slugs: [
      { slug: 'Intro', ref: 'crdt:intro' },
      {
        slug: 'Nested',
        traits: [{ of: 'slug-tree', as: 'child-tree' }],
        data: {
          'child-tree': [{ slug: 'Child' }],
        },
      },
    ],
  },
  {
    slug: 'RefBranch',
    ref: 'crdt:branch',
    slugs: [{ slug: 'Leaf', ref: 'crdt:leaf' }],
  },
];

const TREE_WITH_UNKNOWN_TRAIT: t.SlugTreeProps = [
  {
    slug: 'Root',
    traits: [{ of: 'not-a-thing', as: 'foo' }],
    data: {
      foo: [{ slug: 'Child' }],
    },
  },
];

const TREE_WITH_DUPLICATE_ALIAS: t.SlugTreeProps = [
  {
    slug: 'Root',
    traits: [
      { of: 'slug-tree', as: 'child' },
      { of: 'slug-tree', as: 'child' },
    ],
    data: {
      child: [{ slug: 'Child' }],
    },
  },
];

const TREE_WITH_ORPHAN_DATA: t.SlugTreeProps = [
  {
    slug: 'Root',
    traits: [{ of: 'slug-tree', as: 'child' }],
    data: {
      child: [{ slug: 'Child' }],
      orphan: { slug: 'Ghost', traits: [] },
    },
  },
];

const TREE_WITHOUT_SLUG = [
  {
    ref: 'crdt:missing',
  },
];

describe('SlugTree.validate', () => {
  it('accepts a valid slug-tree payload', () => {
    const result = validateSlugTree(VALID_TREE);
    expect(result.ok).to.eql(true);
  });

  it('flags unknown trait ids', () => {
    const result = validateSlugTree(TREE_WITH_UNKNOWN_TRAIT);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('Unknown trait id');
  });

  it('flags duplicate trait aliases', () => {
    const result = validateSlugTree(TREE_WITH_DUPLICATE_ALIAS);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('Duplicate trait alias');
  });

  it('flags orphan data when no matching alias exists', () => {
    const result = validateSlugTree(TREE_WITH_ORPHAN_DATA);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('Orphan data');
  });

  it('rejects schema mismatches for invalid nodes', () => {
    const result = validateSlugTree(TREE_WITHOUT_SLUG);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('Invalid slug-tree item at index 0');
  });

  it('accepts ref nodes with nested slugs', () => {
    const tree: t.SlugTreeProps = [
      {
        slug: 'Branch',
        ref: 'crdt:branch',
        slugs: [{ slug: 'Child', ref: 'crdt:child' }],
      },
    ];
    const result = validateSlugTree(tree);
    expect(result.ok).to.eql(true);
  });

  it('rejects ref nodes with unknown additional keys', () => {
    const tree: t.SlugTreeProps = [
      // @ts-expect-error: extra key
      { slug: 'Bad', ref: 'crdt:bad', foo: 'bar' },
    ];
    const result = validateSlugTree(tree);
    expect(result.ok).to.eql(false);
    if (result.ok) return;

    expect(result.error.message).to.contain('does not conform to slug-tree schema');
  });
});
