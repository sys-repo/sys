import { type t, describe, it, expect } from '../../-test.ts';
import { Fs, Json } from '../common.ts';
import { bundleSequenceFilepaths } from '../u.lint.seq.files.bundle.ts';

describe('Lint: bundle/sequence files', () => {
  it('records asset stats.bytes when bundling', async () => {
    const tmpDir = await Deno.makeTempDir();
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

      const docid = 'crdt:test-doc' as t.Crdt.Id;
      const node = { id: docid, doc: { current: slugYaml } } as unknown as t.Graph.Dag.Node;
      const dag = { nodes: [node] } as unknown as t.Graph.Dag.Result;

      const result = await bundleSequenceFilepaths(dag, [] as t.ObjectPath, docid, {
        facets: ['sequence:file:video'],
        outDir: tmpDir,
        baseHref: '/base',
      });

      expect(result.issues).to.eql([]);

      const manifestPath = Fs.join(tmpDir, 'manifests', `slug.${docid}.assets.json`);
      const manifestJson = await Deno.readTextFile(manifestPath);
      const manifest = Json.parse(manifestJson) as {
        readonly docid: t.Crdt.Id;
        readonly assets: readonly {
          readonly kind: t.SlugAssetKind;
          readonly logicalPath: t.StringPath;
          readonly filename: string;
          readonly href: string;
          readonly stats: { readonly bytes?: number };
        }[];
      };

      expect(manifest.docid).to.eql(docid);
      expect(manifest.assets.length).to.eql(1);

      const asset = manifest.assets[0];
      expect(asset.kind).to.eql('video');
      expect(asset.logicalPath).to.eql('/:core/thing.mp4');
      expect(asset.href).to.eql(`/base/video/${asset.filename}`);
      expect(asset.stats.bytes).to.eql(5);

      const destPath = Fs.join(tmpDir, 'video', asset.filename);
      expect(await Fs.exists(destPath)).to.eql(true);
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  });
});
