import { type t, describe, expect, it } from '../../-test.ts';
import { fromDag } from '../u.fromDag.ts';

type Dag = t.Graph.Dag.Result;
type Node = t.Graph.Dag.Node;

const INDEX_ID = 'crdt:index-root' as t.Crdt.Id;
const SLUG_ID = 'crdt:media-sequence' as t.Crdt.Id;

/**
 * Slug with media-composition/sequence trait but an invalid sequence
 * (body text without a headline), which should fail validation.
 */
const SLUG_YAML_INVALID_SEQUENCE = `
  title: Example Concept
  description: Short description.

  traits:
    - of: media-composition
      as: sequence

  alias:
    :core-videos: :index/:assets/core

  data:
    sequence:
      - video: /:core-videos/example.webm
        timestamps:
          00:00:00.000:
            text:
              body: "- Body without headline"
`;

describe('Sequence.fromDag', () => {
  const yamlPath = [] as unknown as t.ObjectPath; // raw YAML lives directly in doc.current

  /**
   * Minimal DAG helper: [index node, slug node].
   */
  function makeDag(slugYaml: string): Dag {
    const indexNode = { id: INDEX_ID, doc: { current: INDEX_YAML } } as unknown as Node;
    const slugNode = { id: SLUG_ID, doc: { current: slugYaml } } as unknown as Node;
    return { nodes: [indexNode, slugNode] } as unknown as Dag;
  }

  it('returns a sequence when media-composition/sequence trait is present', async () => {
    const dag = makeDag(SLUG_YAML_WITH_TRAIT);

    const result = await fromDag(dag, yamlPath, SLUG_ID);
    expect(result).to.be.ok;
    if (!result) return;

    expect(Array.isArray(result)).to.eql(true);
    expect(result.length).to.eql(1);

    const first = result[0] as t.SequenceVideoItem;
    expect(first.video).to.eql('/:core-videos/example.webm');
  });

  it('returns <undefined> when the media-composition/sequence trait is missing', async () => {
    const dag = makeDag(SLUG_YAML_NO_TRAIT);
    const result = await fromDag(dag, yamlPath, SLUG_ID);
    expect(result).to.eql(undefined);
  });

  it('returns <undefined> when validate:true and the sequence fails schema invariants', async () => {
    const dag = makeDag(SLUG_YAML_INVALID_SEQUENCE);
    const result = await fromDag(dag, yamlPath, SLUG_ID, { validate: true });
    expect(result).to.eql(undefined);
  });
});

const INDEX_YAML = `
  alias:
    :assets: ~/assets
`;

/**
 * Slug with a media-composition/sequence trait and a simple sequence.
 */
const SLUG_YAML_WITH_TRAIT = `
  title: Example Concept
  description: Short description.

  traits:
    - of: media-composition
      as: sequence

  alias:
    :core-videos: :index/:assets/core

  data:
    sequence:
      - video: /:core-videos/example.webm
        timestamps:
          00:00:00.000:
            text:
              headline: Intro
              body: hello world
`;

/**
 * Same slug, but without the media-composition/sequence trait.
 */
const SLUG_YAML_NO_TRAIT = `
  title: Example Concept
  description: Short description.

  traits:
    - of: slug-list
      as: solo

  alias:
    :core-videos: :index/:assets/core

  data:
    sequence:
      - video: /:core-videos/example.webm
`;
