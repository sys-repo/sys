import { describe, expect, it } from '../../../../-test.ts';
import { playbackFromDag } from '../u.policy.playback.ts';

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

describe('u.policy.playback', () => {
  it('passes through sequence derivation errors', async () => {
    const res = await playbackFromDag(makeDag(SLUG_YAML_NO_TRAIT), yamlPath, SLUG_ID, { validate: true });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.error.message).to.contain('media-composition');
  });

  it('wires sequence -> normalize -> projection into playback manifest', async () => {
    const res = await playbackFromDag(makeDag(SLUG_YAML_WITH_TRAIT), yamlPath, SLUG_ID, { validate: true });
    expect(res.ok).to.eql(true);
    if (!res.ok) return;

    expect(res.sequence.docid).to.eql(SLUG_ID);
    expect(Array.isArray(res.sequence.composition)).to.eql(true);
    expect(res.sequence.composition.length).to.eql(1);
    expect((res.sequence.composition[0] as { src?: string }).src).to.eql('/:core-videos/example.webm');
    expect(res.sequence.beats.length).to.eql(1);
    expect(res.sequence.beats[0].src.kind).to.eql('video');
    expect(res.sequence.beats[0].src.logicalPath).to.eql('/:core-videos/example.webm');
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
        00:00:02.000:
          title: Hi
`;

const SLUG_YAML_NO_TRAIT = `
title: Example Concept
traits:
  - of: slug-list
    as: solo
data:
  sequence:
    - video: /noop
`;
