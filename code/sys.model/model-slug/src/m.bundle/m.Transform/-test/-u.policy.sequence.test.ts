import { describe, expect, it } from '../../../-test.ts';
import { sequenceFromDag } from '../u.policy.sequence.ts';

type Dag = { nodes: Array<{ id: string; doc: { current: string } }> };

const INDEX_ID = 'crdt:index-root';
const SLUG_ID = 'crdt:media-sequence';
const yamlPath = [] as unknown as never;

function makeDag(slugYaml: string): Dag {
  return {
    nodes: [
      { id: INDEX_ID, doc: { current: INDEX_YAML } },
      { id: SLUG_ID, doc: { current: slugYaml } },
    ],
  };
}

describe('u.policy.sequence', () => {
  it('returns sequence from trait-gated path and respects custom "as"', async () => {
    const res = await sequenceFromDag(makeDag(SLUG_YAML_WITH_ALT_SEQUENCE), yamlPath, SLUG_ID);
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.sequence.length).to.eql(1);
    expect((res.sequence[0] as { video?: string }).video).to.eql('/:core-videos/example-alt.webm');
  });

  it('returns gating/validation errors with source-like messages', async () => {
    const missingTrait = await sequenceFromDag(makeDag(SLUG_YAML_NO_TRAIT), yamlPath, SLUG_ID);
    expect(missingTrait.ok).to.eql(false);
    if (!missingTrait.ok) expect(missingTrait.error.message).to.contain('media-composition');

    const invalid = await sequenceFromDag(makeDag(SLUG_YAML_INVALID_SEQUENCE), yamlPath, SLUG_ID, {
      validate: true,
    });
    expect(invalid.ok).to.eql(false);
    if (!invalid.ok) {
      expect(invalid.error.message).to.contain('Invalid sequence at "data/sequence"');
      expect(invalid.error.message).to.contain('body text requires');
    }
  });

  it('honors explicit trait controls (null and custom gate)', async () => {
    const disabled = await sequenceFromDag(makeDag(SLUG_YAML_WITH_TRAIT), yamlPath, SLUG_ID, { trait: null });
    expect(disabled.ok).to.eql(false);
    if (!disabled.ok) expect(disabled.error.message).to.contain('Trait gating disabled');

    const custom = await sequenceFromDag(makeDag(SLUG_YAML_WITH_TRAIT), yamlPath, SLUG_ID, {
      trait: { of: 'not-a-real-trait' },
    });
    expect(custom.ok).to.eql(false);
    if (!custom.ok) expect(custom.error.message).to.contain('not-a-real-trait');
  });
});

const INDEX_YAML = `
alias:
  :assets: ~/assets
`;

const SLUG_YAML_WITH_TRAIT = `
title: Example Concept
traits:
  - of: media-composition
    as: sequence
alias:
  :index: crdt:index-root
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

const SLUG_YAML_WITH_ALT_SEQUENCE = `
title: Example Concept
traits:
  - of: media-composition
    as: foobar
alias:
  :index: crdt:index-root
  :core-videos: :index/:assets/core
data:
  sequence:
    - video: /:core-videos/ignored.webm
  foobar:
    - video: /:core-videos/example-alt.webm
`;

const SLUG_YAML_NO_TRAIT = `
title: Example Concept
traits:
  - of: slug-list
    as: solo
alias:
  :index: crdt:index-root
  :core-videos: :index/:assets/core
data:
  sequence:
    - video: /:core-videos/example.webm
`;

const SLUG_YAML_INVALID_SEQUENCE = `
title: Example Concept
traits:
  - of: media-composition
    as: sequence
alias:
  :index: crdt:index-root
  :core-videos: :index/:assets/core
data:
  sequence:
    - video: /:core-videos/example.webm
      timestamps:
        00:00:00.000:
          text:
            body: "- Body without headline"
`;

