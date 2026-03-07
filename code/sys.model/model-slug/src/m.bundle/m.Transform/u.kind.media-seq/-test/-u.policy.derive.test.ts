import { describe, expect, it } from '../../../../-test.ts';
import { SlugBundleTransform } from '../../mod.ts';

type Dag = { nodes: Array<{ id: string; doc: { current: string } }> };

const INDEX_ID = 'crdt:index-root';
const SLUG_ID = 'crdt:media-sequence';

function makeDag(slugYaml: string): Dag {
  return {
    nodes: [
      { id: INDEX_ID, doc: { current: INDEX_YAML } },
      { id: SLUG_ID, doc: { current: slugYaml } },
    ],
  };
}

describe('u.policy.derive', () => {
  it('returns metadata-only result when dag input does not match transform DAG boundary', async () => {
    const result = await SlugBundleTransform.derive({
      dag: { nope: true },
      yamlPath: ['slug'],
      docid: 'crdt:abc123',
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;

    expect(result.value.docid).to.eql('abc123');
    expect(result.value.manifests).to.eql({});
    expect(result.value.issues).to.eql([]);
    expect(result.value.files.assets.raw).to.eql('manifests/slug.abc123.assets.json');
  });

  it('derives playback + slug-tree manifests from a valid slug DAG', async () => {
    const result = await SlugBundleTransform.derive({
      dag: makeDag(SLUG_YAML_VALID_BOTH),
      yamlPath: [] as unknown as never,
      docid: SLUG_ID,
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;

    expect(result.value.issues).to.eql([]);
    expect(result.value.manifests.playback).to.exist;
    expect(result.value.manifests.tree).to.exist;
    expect(result.value.manifests.playback?.docid).to.eql(SLUG_ID);
    expect(result.value.manifests.tree?.tree?.length).to.eql(1);
  });

  it('derives assets alongside playback + slug-tree when resolver is supplied', async () => {
    const result = await SlugBundleTransform.derive({
      dag: makeDag(SLUG_YAML_VALID_BOTH),
      yamlPath: [] as unknown as never,
      docid: SLUG_ID,
      assetResolver: async (args) => ({
        ok: true as const,
        value: {
          kind: args.kind,
          logicalPath: args.logicalPath,
          hash:
            args.kind === 'video'
              ? '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
              : 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      }),
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;

    expect(result.value.manifests.assets).to.exist;
    expect(result.value.manifests.playback).to.exist;
    expect(result.value.manifests.tree).to.exist;
    expect(result.value.manifests.assets?.assets.length).to.eql(1);
    expect(result.value.issues).to.eql([]);
  });

  it('suppresses playback trait-not-applicable issue unless requirePlayback=true', async () => {
    const dag = makeDag(SLUG_YAML_TREE_ONLY);

    const bestEffort = await SlugBundleTransform.derive({
      dag,
      yamlPath: [] as unknown as never,
      docid: SLUG_ID,
      requirePlayback: false,
    });
    expect(bestEffort.ok).to.eql(true);
    if (bestEffort.ok) {
      expect(bestEffort.value.manifests.playback).to.eql(undefined);
      expect(bestEffort.value.manifests.tree).to.exist;
      expect(bestEffort.value.issues.some((d) => d.kind === 'sequence:playback:not-exported')).to.eql(false);
    }

    const required = await SlugBundleTransform.derive({
      dag,
      yamlPath: [] as unknown as never,
      docid: SLUG_ID,
      requirePlayback: true,
    });
    expect(required.ok).to.eql(true);
    if (required.ok) {
      const issue = required.value.issues.find((d) => d.kind === 'sequence:playback:not-exported');
      expect(issue?.severity).to.eql('error');
      expect(issue?.raw).to.eql('manifests/slug.media-sequence.playback.json');
      expect(issue?.message.includes('Playback manifest could not be generated')).to.eql(true);
    }
  });
});

const INDEX_YAML = `
alias:
  :assets: ~/assets
`;

const SLUG_YAML_VALID_BOTH = `
title: Example
traits:
  - of: media-composition
    as: sequence
  - of: slug-tree
    as: nav

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
  nav:
    tree:
      - slug: Intro
        ref: crdt:intro
`;

const SLUG_YAML_TREE_ONLY = `
title: Example
traits:
  - of: slug-tree
    as: nav

alias:
  :index: crdt:index-root
  :core-videos: :index/:assets/core

data:
  nav:
    tree:
      - slug: Intro
        ref: crdt:intro
`;
