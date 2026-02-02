import { describe, expect, it } from '../../-test.ts';
import { jsonResponse, makeDist, stubFetch } from '../../-test/u.fixture.ts';
import { type t, Schema, SlugClient } from '../common.ts';
import { SchemaBundleConfig } from '../schema/mod.ts';

describe('BundleProfile domain-free config (e2e)', () => {
  it('validates schema and loads via SlugClient.fromDescriptor', async () => {
    const config = {
      bundles: [
        {
          kind: 'slug-tree:fs',
          include: ['.md'],
          crdt: { docid: 'slug:kb', path: '/slug' },
          source: '/repo/docs/slc-knowledge/venture-example-libraries',
          target: {
            manifests: [
              './staging.cdn/slc/default/kb/-manifests/slug-tree.kb.json',
              './staging.cdn/slc/default/kb/-manifests/slug-tree.kb.yaml',
            ],
            dir: [
              { kind: 'source', path: './staging.cdn/slc/default/kb/source/' },
              { kind: 'sha256', path: './staging.cdn/slc/default/kb/content/' },
            ],
          },
        },
        {
          kind: 'slug-tree:media:seq',
          requirePlayback: false,
          crdt: { docid: 'slug:program', path: '/slug' },
          target: {
            manifests: {
              base: './staging.cdn/slc/default/program',
              hrefBase: '/assets',
              dir: '-manifests',
              assets: 'slug.<docid>.assets.json',
              playback: 'slug.<docid>.playback.json',
              tree: 'slug-tree.<docid>.json',
            },
            media: {
              video: { base: './staging.cdn/slc/video/program', hrefBase: '/assets', dir: '.' },
              image: {
                base: './staging.cdn/slc/default/program',
                hrefBase: '/assets',
                dir: 'image',
              },
            },
          },
        },
      ],
    } as const satisfies t.BundleProfile;

    expect(Schema.Value.Check(SchemaBundleConfig, config)).to.eql(true);

    const fsDocid = 'slug:kb' as t.StringId;
    const mediaDocid = 'slug:program' as t.StringId;
    const fsClean = SlugClient.Url.clean(fsDocid);
    const mediaClean = SlugClient.Url.clean(mediaDocid);

    const descriptor: t.BundleDescriptorDoc = {
      bundles: [
        {
          kind: 'slug-tree:fs',
          version: 1,
          docid: fsDocid,
          layout: { manifestsDir: '-manifests', contentDir: 'content' },
          files: { tree: `slug-tree.${fsClean}.json`, index: `slug-tree.${fsClean}.assets.json` },
        },
        {
          kind: 'slug-tree:media:seq',
          version: 1,
          docid: mediaDocid,
          layout: { manifestsDir: '-manifests', mediaDirs: { video: 'video', image: 'image' } },
          files: {
            assets: `slug.${mediaClean}.assets.json`,
            playback: `slug.${mediaClean}.playback.json`,
            tree: `slug-tree.${mediaClean}.json`,
          },
        },
      ],
    };

    const treePayload: t.SlugTreeDoc = { tree: [{ slug: 'intro', ref: 'slug:intro' }] };
    const fileIndex: t.SlugFileContentIndex = {
      docid: fsClean,
      entries: [{ hash: 'hash-a', contentType: 'text/plain', frontmatter: { ref: 'crdt:a' } }],
    };
    const filePayload: t.SlugFileContentDoc = {
      source: 'hello',
      hash: 'hash-a',
      contentType: 'text/plain',
      frontmatter: { ref: 'crdt:a' },
    };

    const assetsManifest: t.SpecTimelineAssetsManifest = {
      docid: mediaClean,
      assets: [
        {
          kind: 'video',
          logicalPath: '/video/a.mp4',
          hash: 'hash-video',
          filename: 'a.mp4',
          href: '/video/a.mp4',
        },
        {
          kind: 'image',
          logicalPath: '/image/b.jpg',
          hash: 'hash-image',
          filename: 'b.jpg',
          href: '/image/b.jpg',
        },
      ],
    };

    const playbackManifest: t.SpecTimelineManifest = {
      docid: mediaClean,
      composition: [{ src: 'video/a.mp4' }] as t.Timecode.Composite.Spec,
      beats: [
        {
          src: { kind: 'video', logicalPath: '/video/a.mp4', time: 0 as t.Msecs },
          payload: null,
        },
      ],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(mediaClean),
      SlugClient.Url.playbackFilename(mediaClean),
    ]);

    const seen: string[] = [];
    const cleanup = stubFetch((url) => {
      seen.push(url);
      if (url.includes(SlugClient.Url.treeFilename(fsClean))) return jsonResponse(treePayload);
      if (url.includes(SlugClient.Url.treeAssetsFilename(fsClean))) return jsonResponse(fileIndex);
      if (url.includes(SlugClient.Url.fileContentFilename('hash-a')))
        return jsonResponse(filePayload);
      if (url.includes('dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(mediaClean)))
        return jsonResponse(assetsManifest);
      if (url.includes(SlugClient.Url.playbackFilename(mediaClean)))
        return jsonResponse(playbackManifest);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const fsClient = SlugClient.fromDescriptor({
        descriptor,
        kind: 'slug-tree:fs',
        docid: fsDocid,
        baseUrl: 'https://default.example.com/kb/',
      });
      if (!fsClient.ok) throw new Error('expected fs client');

      const treeResult = await fsClient.value.Tree.load({
        manifestsBaseUrl: 'https://manifests.example.com/kb/',
      });
      if (!treeResult.ok) throw new Error('expected tree result');

      const indexResult = await fsClient.value.FileContent.index({
        manifestsBaseUrl: 'https://manifests.example.com/kb/',
        contentBaseUrl: 'https://content.example.com/kb/',
      });
      if (!indexResult.ok) throw new Error('expected index result');

      const docResult = await fsClient.value.FileContent.get('hash-a', {
        manifestsBaseUrl: 'https://manifests.example.com/kb/',
        contentBaseUrl: 'https://content.example.com/kb/',
      });
      if (!docResult.ok) throw new Error('expected doc result');

      const mediaClient = SlugClient.fromDescriptor({
        descriptor,
        kind: 'slug-tree:media:seq',
        docid: mediaDocid,
        baseUrl: 'https://media.example.com/program/',
      });
      if (!mediaClient.ok) throw new Error('expected media client');

      const bundleResult = await mediaClient.value.Bundle.load({
        baseHref: 'https://media.example.com/',
        hrefResolver: ({ href, kind }) => {
          const path = new URL(href).pathname;
          if (kind === 'video') return `https://video.example.com${path}`;
          if (kind === 'image') return `https://images.example.com${path}`;
          return href;
        },
      });

      if (!bundleResult.ok) throw new Error('expected bundle result');
      const assetVideo = bundleResult.value.resolveAsset({
        kind: 'video',
        logicalPath: '/video/a.mp4',
      });
      const assetImage = bundleResult.value.resolveAsset({
        kind: 'image',
        logicalPath: '/image/b.jpg',
      });

      expect(assetVideo?.href).to.eql('https://video.example.com/video/a.mp4');
      expect(assetImage?.href).to.eql('https://images.example.com/image/b.jpg');
      expect(seen.some((url) => url.includes('https://manifests.example.com'))).to.eql(true);
      expect(seen.some((url) => url.includes('https://content.example.com'))).to.eql(true);
    } finally {
      cleanup();
    }
  });
});
