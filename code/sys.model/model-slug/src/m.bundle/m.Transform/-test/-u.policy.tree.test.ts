import { describe, expect, it } from '../../../-test.ts';
import { slugTreeFromDag } from '../u.policy.tree.ts';

type Dag = { nodes: Array<{ id: string; doc: { current: string } }> };
const SLUG_ID = 'crdt:slug-tree-doc';
const yamlPath = [] as unknown as never;

function makeDag(slugYaml: string): Dag {
  return { nodes: [{ id: SLUG_ID, doc: { current: slugYaml } }] };
}

describe('u.policy.tree', () => {
  it('derives slug-tree from trait-gated path', async () => {
    const res = await slugTreeFromDag(makeDag(SLUG_TREE_YAML_VALID), yamlPath, SLUG_ID, { validate: true });
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.sequence).to.eql({
      tree: [
        {
          slug: 'Section A',
          slugs: [{ slug: 'Intro', ref: 'crdt:intro' }],
        },
      ],
    });
  });

  it('returns source-like errors for missing trait and missing tree array', async () => {
    const missingTrait = await slugTreeFromDag(makeDag(SLUG_TREE_YAML_NO_TRAIT), yamlPath, SLUG_ID, { validate: true });
    expect(missingTrait.ok).to.eql(false);
    if (!missingTrait.ok) expect(missingTrait.error.message).to.contain('slug-tree');

    const missingArray = await slugTreeFromDag(makeDag(SLUG_TREE_YAML_BAD_ARRAY), yamlPath, SLUG_ID, { validate: true });
    expect(missingArray.ok).to.eql(false);
    if (!missingArray.ok) expect(missingArray.error.message).to.contain('expected slug-tree array');
  });

  it('prefixes schema validation errors with data/<as> path', async () => {
    const invalid = await slugTreeFromDag(makeDag(SLUG_TREE_YAML_INVALID), yamlPath, SLUG_ID, { validate: true });
    expect(invalid.ok).to.eql(false);
    if (!invalid.ok) {
      expect(invalid.error.message).to.contain('Invalid slug-tree at "data/tree"');
      expect(invalid.error.message).to.contain('Invalid slug-tree item at index 0');
    }
  });
});

const SLUG_TREE_YAML_VALID = `
title: Slug Tree Test
traits:
  - of: slug-tree
    as: foo
data:
  foo:
    tree:
      - slug: Section A
        slugs:
          - slug: Intro
            ref: crdt:intro
`;

const SLUG_TREE_YAML_NO_TRAIT = `
title: Slug Tree Skip
traits:
  - of: media-composition
    as: sequence
data:
  tree:
    tree:
      - slug: Intro
`;

const SLUG_TREE_YAML_BAD_ARRAY = `
title: Slug Tree Bad
traits:
  - of: slug-tree
    as: foo
data:
  foo:
    tree: nope
`;

const SLUG_TREE_YAML_INVALID = `
title: Slug Tree Invalid
traits:
  - of: slug-tree
    as: tree
data:
  tree:
    tree:
      - ref: crdt:missing
`;
