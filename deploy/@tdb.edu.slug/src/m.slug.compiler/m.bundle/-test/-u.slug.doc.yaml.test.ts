import { describe, expect, Fs, it } from '../../-test.ts';
import { bundleSlugDocYaml } from '../m.bundle.slug-doc.yaml/mod.ts';

describe('bundle: slug:fs:yaml', () => {
  it('materializes authored yaml docs to disk using cleaned docid filenames', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const dag = {
        nodes: [
          {
            id: 'crdt:doc-a',
            doc: {
              current: {
                slug: `
alias:
  title: Sample
traits:
  - of: media-composition
    as: sequence
data:
  sequence:
    - video: clip.mp4
`,
              },
            },
          },
          {
            id: 'crdt:doc-b',
            doc: { current: { slug: '' } },
          },
        ],
      } as const;

      const result = await bundleSlugDocYaml({
        cwd: tmpDir,
        dag: dag as never,
        yamlPath: ['slug'],
        config: {
          crdt: { docid: 'crdt:root', path: '/slug' },
          target: { dir: './authored', filenames: { mode: 'docid' } },
        },
      });

      expect(result.written.length).to.eql(1);
      const path = Fs.join(tmpDir, 'authored', 'slug.crdt-doc-a.yaml');
      const raw = await Deno.readTextFile(path);
      expect(raw).to.contain('traits:');
      expect(raw).to.contain('data:');
      expect(raw).to.contain('sequence:');
    } finally {
      await Fs.remove(tmpDir);
    }
  });
});
