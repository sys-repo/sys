import { type t, describe, expect, Ffmpeg, it } from '../../-test.ts';
import { Crdt, Fs, Json, Shard } from '../common.ts';
import { bundleSequenceFilepaths } from '../u.bundle.seq.files.ts';

async function withMockedDuration<T>(
  mock: typeof Ffmpeg.duration,
  fn: () => Promise<T>,
): Promise<T> {
  const original = Object.getOwnPropertyDescriptor(Ffmpeg, 'duration');
  Object.defineProperty(Ffmpeg, 'duration', {
    value: mock,
    configurable: true,
  });

  try {
    return await fn();
  } finally {
    if (original) {
      Object.defineProperty(Ffmpeg, 'duration', original);
    } else {
      // Remove the mock property if the original descriptor did not exist.
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (Ffmpeg as Record<string, unknown>)['duration'];
    }
  }
}

function expectShardMeta(args: {
  shard: { readonly strategy: 'prefix-range'; readonly total: number; readonly index: number };
  total: number;
  hash: string;
}) {
  const expected = Shard.meta(Shard.policy(args.total), args.hash);
  expect(args.shard).to.eql(expected);
}

describe('Lint: bundle/sequence files', () => {
  it('records asset stats.bytes when bundling', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const sourceDir = Fs.join(tmpDir, 'source');
      await Fs.ensureDir(sourceDir);

      const resolvedPath = Fs.join(sourceDir, 'thing.mp4');
      await Fs.write(resolvedPath, 'hello');

      const slugYaml = `
        title: Bundler Test
        traits:
          - of: media-composition
            as: sequence

        alias:
          :core: "${sourceDir}"

        data:
          sequence:
            - video: /:core/thing.mp4

      `;

      const docid = 'crdt:21JvXzARPYFXDVMag3x4UhLgHcQi' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
        outDir: tmpDir,
        baseHref: '/sample-base',
        target: { media: { video: { dir: 'video', shard: { total: 64 } } } },
      });

      const assetsIssue = result.issues.find((item) => item.kind === 'sequence:assets:not-exported');
      expect(assetsIssue).to.eql(undefined);

      const manifestPath = Fs.join(
        tmpDir,
        'manifests',
        'slug.21JvXzARPYFXDVMag3x4UhLgHcQi.assets.json',
      );
      const manifestJson = (await Fs.readText(manifestPath)).data;
      const manifest = Json.parse(manifestJson) as {
        readonly docid: t.Crdt.Id;
        readonly assets: readonly {
          readonly kind: t.SlugAssetKind;
          readonly logicalPath: t.StringPath;
          readonly hash: string;
          readonly filename: string;
          readonly href: string;
          readonly shard?: {
            readonly strategy: 'prefix-range';
            readonly total: number;
            readonly index: number;
          };
          readonly stats: { readonly bytes?: number; readonly duration?: t.Msecs };
        }[];
      };

      expect(manifest.docid).to.eql(docid);
      expect(manifest.assets.length).to.eql(1);

      const asset = manifest.assets[0];
      expect(asset.kind).to.eql('video');
      expect(asset.logicalPath).to.eql('/:core/thing.mp4');
      expect(asset.href).to.eql(`/sample-base/video/${asset.filename}`);
      expect(asset.stats.bytes).to.eql(5);
      if (!asset.shard) throw new Error('Expected shard metadata');
      expectShardMeta({ shard: asset.shard, total: 64, hash: asset.hash });

      const destPath = Fs.join(tmpDir, 'video', asset.filename);
      expect(await Fs.exists(destPath)).to.eql(true);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('applies per-kind shard config (video+image)', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const sourceDir = Fs.join(tmpDir, 'source');
      await Fs.ensureDir(sourceDir);

      const videoPath = Fs.join(sourceDir, 'thing.mp4');
      const imagePath = Fs.join(sourceDir, 'thing.png');
      await Fs.write(videoPath, 'hello-video');
      await Fs.write(imagePath, 'hello-image');

      const slugYaml = `
        title: Bundler Test (per-kind shard)
        traits:
          - of: media-composition
            as: sequence

        alias:
          :core: "${sourceDir}"

        data:
          sequence:
            - video: /:core/thing.mp4
            - image: /:core/thing.png

      `;

      const docid = 'crdt:2EHNBpXoYz7tM8LjW6fzG57iofS4' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
        outDir: tmpDir,
        baseHref: '/sample-base',
        target: {
          media: {
            video: { dir: 'video/sample-partition-<shard>', shard: { total: 64 } },
            image: { dir: 'image/sample-partition-<shard>', shard: { total: 16 } },
          },
        },
      });

      const assetsIssue = result.issues.find((item) => item.kind === 'sequence:assets:not-exported');
      expect(assetsIssue).to.eql(undefined);

      const manifestPath = Fs.join(
        tmpDir,
        'manifests',
        'slug.2EHNBpXoYz7tM8LjW6fzG57iofS4.assets.json',
      );
      const manifestJson = (await Fs.readText(manifestPath)).data;
      const manifest = Json.parse(manifestJson) as {
        readonly docid: t.Crdt.Id;
        readonly assets: readonly {
          readonly kind: t.SlugAssetKind;
          readonly logicalPath: t.StringPath;
          readonly hash: string;
          readonly filename: string;
          readonly href: string;
          readonly shard?: {
            readonly strategy: 'prefix-range';
            readonly total: number;
            readonly index: number;
          };
          readonly stats: { readonly bytes?: number; readonly duration?: t.Msecs };
        }[];
      };

      const video = manifest.assets.find((a) => a.kind === 'video');
      const image = manifest.assets.find((a) => a.kind === 'image');
      expect(video?.shard?.total).to.eql(64);
      expect(image?.shard?.total).to.eql(16);
      if (!video?.shard || !image?.shard) throw new Error('Expected shard metadata');
      expectShardMeta({ shard: video.shard, total: 64, hash: video.hash });
      expectShardMeta({ shard: image.shard, total: 16, hash: image.hash });
      expect(video.href).to.eql(
        `/sample-base/video/sample-partition-${video.shard.index}/${video.filename}`,
      );
      expect(image.href).to.eql(
        `/sample-base/image/sample-partition-${image.shard.index}/${image.filename}`,
      );
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('expands <shards> and <shard> templates in dir', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const sourceDir = Fs.join(tmpDir, 'source');
      await Fs.ensureDir(sourceDir);

      const videoPath = Fs.join(sourceDir, 'thing.mp4');
      await Fs.write(videoPath, 'hello-video');

      const slugYaml = `
        title: Bundler Test (shards template)
        traits:
          - of: media-composition
            as: sequence

        alias:
          :core: "${sourceDir}"

        data:
          sequence:
            - video: /:core/thing.mp4

      `;

      const docid = 'crdt:2x8v9oJQH1H6o2vD1dJ8jT5H1p3a' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
        outDir: tmpDir,
        baseHref: '/sample-base',
        target: {
          media: {
            video: { dir: 'video/sample-ns-<shards>/sample-partition-<shard>', shard: { total: 64 } },
          },
        },
      });

      const assetsIssue = result.issues.find((item) => item.kind === 'sequence:assets:not-exported');
      expect(assetsIssue).to.eql(undefined);

      const clean = Crdt.Id.clean(String(docid)) ?? '';
      const manifestPath = Fs.join(tmpDir, 'manifests', `slug.${clean}.assets.json`);
      const manifestJson = (await Fs.readText(manifestPath)).data;
      const manifest = Json.parse(manifestJson) as {
        readonly assets: readonly {
          readonly kind: t.SlugAssetKind;
          readonly hash: string;
          readonly filename: string;
          readonly href: string;
          readonly shard?: {
            readonly strategy: 'prefix-range';
            readonly total: number;
            readonly index: number;
          };
        }[];
      };

      const asset = manifest.assets.find((a) => a.kind === 'video');
      if (!asset?.shard) throw new Error('Expected shard metadata');
      expectShardMeta({ shard: asset.shard, total: 64, hash: asset.hash });
      expect(asset.href).to.eql(
        `/sample-base/video/sample-ns-64/sample-partition-${asset.shard.index}/${asset.filename}`,
      );
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('omits shard when not configured', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const sourceDir = Fs.join(tmpDir, 'source');
      await Fs.ensureDir(sourceDir);

      const videoPath = Fs.join(sourceDir, 'thing.mp4');
      const imagePath = Fs.join(sourceDir, 'thing.png');
      await Fs.write(videoPath, 'hello-video');
      await Fs.write(imagePath, 'hello-image');

      const slugYaml = `
        title: Bundler Test (no shard)
        traits:
          - of: media-composition
            as: sequence

        alias:
          :core: "${sourceDir}"

        data:
          sequence:
            - video: /:core/thing.mp4
            - image: /:core/thing.png

      `;

      const docid = 'crdt:2irtwwtQNj8GVrUguPjNERrAgLMx' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
        outDir: tmpDir,
        baseHref: '/sample-base',
        target: {
          media: {
            video: { dir: 'video/sample-partition-<shard>' },
            image: { dir: 'image/sample-partition-<shard>' },
          },
        },
      });

      const assetsIssue = result.issues.find((item) => item.kind === 'sequence:assets:not-exported');
      expect(assetsIssue).to.eql(undefined);

      const manifestPath = Fs.join(
        tmpDir,
        'manifests',
        'slug.2irtwwtQNj8GVrUguPjNERrAgLMx.assets.json',
      );
      const manifestJson = (await Fs.readText(manifestPath)).data;
      const manifest = Json.parse(manifestJson) as {
        readonly assets: readonly { readonly kind: t.SlugAssetKind; readonly shard?: unknown; readonly href: string }[];
      };

      const video = manifest.assets.find((a) => a.kind === 'video');
      const image = manifest.assets.find((a) => a.kind === 'image');
      expect(video?.shard).to.eql(undefined);
      expect(image?.shard).to.eql(undefined);
      if (!video || !image) throw new Error('Expected video and image assets');
      expect(video.href).to.include('/sample-base/video/sample-partition-<shard>/');
      expect(image.href).to.include('/sample-base/image/sample-partition-<shard>/');
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('emits slug-tree manifest when slug-tree trait is present', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const slugTreeYaml = `
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
              - slug: Section B
                traits:
                  - of: slug-tree
                    as: nested
                data:
                  nested:
                    tree:
                      - slug: Child
      `;

      const docid = 'crdt:3ncU6zd9tvqEad7qZ4fD5F2s828Z' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugTreeYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
        outDir: tmpDir,
      });

      expect(result.issues).to.eql([]);

      const slugTreePath = Fs.join(
        tmpDir,
        'manifests',
        'slug-tree.3ncU6zd9tvqEad7qZ4fD5F2s828Z.json',
      );
      expect(await Fs.exists(slugTreePath)).to.eql(true);

      const raw = (await Fs.readText(slugTreePath)).data;
      const payload = Json.parse(raw);
      expect(payload).to.eql({
        tree: [
          {
            slug: 'Section A',
            slugs: [{ slug: 'Intro', ref: 'crdt:intro' }],
          },
          {
            slug: 'Section B',
            traits: [{ of: 'slug-tree', as: 'nested' }],
            data: {
              nested: {
                tree: [{ slug: 'Child' }],
              },
            },
          },
        ],
      });
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('preserves slug-tree inline description through bundle', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const slugTreeYaml = `
        title: Slug Tree Description
        traits:
          - of: slug-tree
            as: tree

        data:
          tree:
            tree:
              - slug: Root
                slugs:
                  - slug: Child
                    description: Inline description
      `;

      const docid = 'crdt:21FX8m83NgtGptaxoikg5aSReYv3' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugTreeYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
        outDir: tmpDir,
      });

      expect(result.issues).to.eql([]);

      const slugTreePath = Fs.join(
        tmpDir,
        'manifests',
        'slug-tree.21FX8m83NgtGptaxoikg5aSReYv3.json',
      );
      expect(await Fs.exists(slugTreePath)).to.eql(true);

      const raw = (await Fs.readText(slugTreePath)).data;
      const payload = Json.parse(raw) as {
        tree?: { slugs?: { description?: string }[] }[];
      };

      expect(payload.tree?.[0]?.slugs?.[0]?.description).to.eql('Inline description');
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('skips slug-tree manifest when trait is missing', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const slugYaml = `
        title: Slug Tree Skip
        traits:
          - of: media-composition
            as: sequence

        data:
          sequence:
            - video: /noop
      `;

      const docid = 'crdt:2kcH93dUVmRsZq77YVbaTLNGPr8z' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
        outDir: tmpDir,
      });

      const slugTreePath = Fs.join(
        tmpDir,
        'manifests',
        'slug-tree.2kcH93dUVmRsZq77YVbaTLNGPr8z.json',
      );
      expect(await Fs.exists(slugTreePath)).to.eql(false);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('surfaces validator formatting when assets manifest fails validation', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const sourceDir = Fs.join(tmpDir, 'source');
      await Fs.ensureDir(sourceDir);

      const resolvedPath = Fs.join(sourceDir, 'thing.ts');
      await Fs.write(resolvedPath, 'invalid duration');

      const slugYaml = `
        title: Bundler Validation Test
        traits:
          - of: media-composition
            as: sequence

        alias:
          :core: "${sourceDir}"

        data:
          sequence:
            - video: /:core/thing.ts
      `;

      const docid = 'crdt:2EqLQAQDesykoMbMVas1mq6smDN2' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      await withMockedDuration(
        async () => ({ ok: true, msecs: 'bad' as unknown as t.Msecs }),
        async () => {
          const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
            outDir: tmpDir,
            baseHref: '/base',
            target: { media: { video: { dir: 'video' } } },
          });

          const issue = result.issues.find((item) => item.kind === 'sequence:assets:not-exported');
          expect(issue).to.not.eql(undefined);
          expect(issue?.message).to.include(
            'Assets manifest failed @sys/schema validation. Reason:',
          );
          expect(issue?.message).to.include(':');

          const manifestPath = Fs.join(
            tmpDir,
            'manifests',
            'slug.2EqLQAQDesykoMbMVas1mq6smDN2.assets.json',
          );
          expect(await Fs.exists(manifestPath)).to.eql(false);
        },
      );
    } finally {
      await Fs.remove(tmpDir);
    }
  });
});
