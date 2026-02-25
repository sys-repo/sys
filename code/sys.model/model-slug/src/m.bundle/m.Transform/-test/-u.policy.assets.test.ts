import { describe, expect, it } from '../../../-test.ts';
import { deriveAssets } from '../u.policy.assets.ts';
import { deriveMeta } from '../u.policy.meta.ts';

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

describe('u.policy.assets', () => {
  it('returns no manifest when no assetResolver is supplied', async () => {
    const derive = {
      dag: makeDag(SLUG_YAML_WITH_MEDIA),
      yamlPath,
      docid: SLUG_ID,
    } as const;

    const res = await deriveAssets({ derive, base: deriveMeta(derive) });
    expect(res.issues).to.eql([]);
    expect(res.manifest).to.eql(undefined);
  });

  it('honors explicit facets filter (including empty/non-media) without fallback', async () => {
    const base = {
      dag: makeDag(SLUG_YAML_WITH_MEDIA),
      yamlPath,
      docid: SLUG_ID,
      assetResolver: async () => ({
        ok: true as const,
        value: {
          kind: 'video' as const,
          logicalPath: '/:core-videos/example.webm',
          hash: HASH_VIDEO,
        },
      }),
    };

    const emptyFacets = { ...base, facets: [] as const };
    const emptyRes = await deriveAssets({ derive: emptyFacets, base: deriveMeta(emptyFacets) });
    expect(emptyRes.issues).to.eql([]);
    expect(emptyRes.manifest).to.eql(undefined);

    const nonMediaFacets = { ...base, facets: ['foo:bar'] as const };
    const nonMediaRes = await deriveAssets({ derive: nonMediaFacets, base: deriveMeta(nonMediaFacets) });
    expect(nonMediaRes.issues).to.eql([]);
    expect(nonMediaRes.manifest).to.eql(undefined);
  });

  it('derives assets manifest with shard/href/duration from resolver + probe', async () => {
    const derive = {
      dag: makeDag(SLUG_YAML_WITH_MEDIA),
      yamlPath,
      docid: SLUG_ID,
      target: {
        manifests: { hrefBase: '/program' },
        media: {
          video: {
            dir: 'video/shard.<shard>',
            hrefBase: '/video-cdn',
            shard: { total: 16, strategy: 'prefix-range' as const },
          },
          image: {
            dir: 'images',
            hrefBase: '/img-cdn',
          },
        },
      },
      assetResolver: async (args: { kind: string; logicalPath: string }) => {
        if (args.kind === 'video') {
          return {
            ok: true as const,
            value: {
              kind: 'video' as const,
              logicalPath: args.logicalPath,
              hash: HASH_VIDEO,
              bytes: new Uint8Array([1, 2, 3]),
            },
          };
        }
        return {
          ok: true as const,
          value: {
            kind: 'image' as const,
            logicalPath: args.logicalPath,
            hash: args.logicalPath.includes('ts-01') ? HASH_IMAGE_B : HASH_IMAGE_A,
            stats: { bytes: 42 },
          },
        };
      },
      durationProbe: async (args: { asset: { kind: string } }) => {
        return args.asset.kind === 'video' ? 1234 : undefined;
      },
    };

    const res = await deriveAssets({ derive, base: deriveMeta(derive) });
    expect(res.issues).to.eql([]);
    expect(res.manifest).to.exist;
    expect(res.manifest?.docid).to.eql(SLUG_ID);
    expect(res.manifest?.assets.length).to.eql(3);

    const video = res.manifest?.assets.find((d) => d.kind === 'video');
    expect(video).to.exist;
    expect(video?.filename).to.eql(`${HASH_VIDEO}.webm`);
    expect(video?.href.startsWith('/video-cdn/video/shard.')).to.eql(true);
    expect(video?.href.endsWith(`/${HASH_VIDEO}.webm`)).to.eql(true);
    expect(video?.shard?.strategy).to.eql('prefix-range');
    expect(video?.shard?.total).to.eql(16);
    expect(video?.stats?.bytes).to.eql(3);
    expect(video?.stats?.duration).to.eql(1234);

    const images = res.manifest?.assets.filter((d) => d.kind === 'image') ?? [];
    expect(images.length).to.eql(2);
    expect(images.every((d) => d.href.startsWith('/img-cdn/images/'))).to.eql(true);
  });

  it('emits partial-success assets manifest while collecting resolver issues', async () => {
    const derive = {
      dag: makeDag(SLUG_YAML_WITH_MEDIA),
      yamlPath,
      docid: SLUG_ID,
      assetResolver: async (args: { kind: string; logicalPath: string }) => {
        if (args.logicalPath.includes('cover.png')) return { ok: false as const, error: new Error('missing cover') };
        return {
          ok: true as const,
          value: {
            kind: args.kind === 'video' ? ('video' as const) : ('image' as const),
            logicalPath: args.logicalPath,
            hash: args.kind === 'video' ? HASH_VIDEO : HASH_IMAGE_B,
          },
        };
      },
    };

    const res = await deriveAssets({ derive, base: deriveMeta(derive) });
    expect(res.manifest).to.exist;
    expect(res.manifest?.assets.length).to.eql(2);
    expect(res.issues.length).to.eql(1);
    expect(res.issues[0].kind).to.eql('image-path:not-found');
    expect(res.issues[0].message).to.contain('missing cover');
  });

  it('emits sequence:assets:not-exported when assembled manifest fails schema validation', async () => {
    const derive = {
      dag: makeDag(SLUG_YAML_VIDEO_ONLY),
      yamlPath,
      docid: SLUG_ID,
      assetResolver: async () => ({
        ok: true as const,
        value: {
          kind: 'video' as const,
          logicalPath: '/:core-videos/example.webm',
          hash: HASH_VIDEO,
          shard: {
            strategy: 'bad-strategy' as unknown as 'prefix-range',
            total: 1,
            index: 0,
          },
        },
      }),
    };

    const res = await deriveAssets({ derive, base: deriveMeta(derive) });
    expect(res.manifest).to.eql(undefined);
    const issue = res.issues.find((d) => d.kind === 'sequence:assets:not-exported');
    expect(issue?.severity).to.eql('error');
    expect(issue?.path).to.eql('');
    expect(issue?.raw).to.eql('manifests/slug.media-sequence.assets.json');
    expect(issue?.message).to.contain('Assets manifest failed @sys/schema validation');
  });

  it('emits source-like path issues for resolver miss/error and returns no manifest', async () => {
    const derive = {
      dag: makeDag(SLUG_YAML_VIDEO_ONLY),
      yamlPath,
      docid: SLUG_ID,
      assetResolver: async () => ({ ok: false as const, error: new Error('disk offline') }),
    };
    const miss = await deriveAssets({ derive, base: deriveMeta(derive) });
    expect(miss.manifest).to.eql(undefined);
    expect(miss.issues.length).to.eql(1);
    expect(miss.issues[0].kind).to.eql('video-path:not-found');
    expect(miss.issues[0].message).to.contain('disk offline');

    const notFound = {
      ...derive,
      assetResolver: async () => ({ ok: true as const, value: undefined }),
    };
    const res = await deriveAssets({ derive: notFound, base: deriveMeta(notFound) });
    expect(res.manifest).to.eql(undefined);
    expect(res.issues.length).to.eql(1);
    expect(res.issues[0].kind).to.eql('video-path:not-found');
    expect(res.issues[0].message).to.contain('does not exist');
  });
});

const INDEX_YAML = `
alias:
  :assets: ~/assets
`;

const SLUG_YAML_WITH_MEDIA = `
title: Example
traits:
  - of: media-composition
    as: sequence
alias:
  :index: crdt:index-root
  :core-videos: :index/:assets/core
  :core-images: :index/:assets/images
data:
  sequence:
    - video: /:core-videos/example.webm
      image: /:core-images/cover.png
      timestamps:
        00:00:00.000:
          image: /:core-images/ts-01.png
          title: Intro
`;

const SLUG_YAML_VIDEO_ONLY = `
title: Example
traits:
  - of: media-composition
    as: sequence
alias:
  :index: crdt:index-root
  :core-videos: :index/:assets/core
data:
  sequence:
    - video: /:core-videos/example.webm
`;

const HASH_VIDEO = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const HASH_IMAGE_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const HASH_IMAGE_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
