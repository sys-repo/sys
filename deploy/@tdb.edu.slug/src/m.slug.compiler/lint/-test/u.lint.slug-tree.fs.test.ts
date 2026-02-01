import { type t, describe, expect, Fs, Hash, it } from '../../-test.ts';
import { Json, SlugSchema } from '../common.ts';
import { runSlugTreeFs } from '../u.lint.slug-tree.ts';
import { LintProfileSchema } from '../u.schema.ts';

describe('Lint: slug-tree:fs', () => {
  it('writes sha256 per-file export with source + path + hash', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const srcDir = Fs.join(tmpDir, 'src');
      await Fs.ensureDir(Fs.join(srcDir, 'sub'));

      await Fs.write(Fs.join(srcDir, 'a.md'), 'hello');
      await Fs.write(Fs.join(srcDir, 'b.txt'), 'skip');
      await Fs.write(Fs.join(srcDir, 'sub', 'c.md'), 'world');

      const profilePath = Fs.join(tmpDir, 'lint.yaml');
      const doc: t.SlugLintProfile = {
        facets: ['bundle:slug-tree:fs'],
        'bundle:slug-tree:fs': {
          source: 'src',
          target: {
            manifest: 'out/slug-tree.kb.json',
            dir: [
              { kind: 'source', path: 'out/src' },
              { kind: 'sha256', path: 'out/sha256' },
            ],
            crdt: {
              ref: 'slug:test',
              path: 'data/example',
            },
          },
        },
      };

      await Fs.write(profilePath, LintProfileSchema.stringify(doc));

      await runSlugTreeFs({
        cwd: tmpDir,
        profilePath,
        createCrdt: async () => 'crdt:test' as t.StringRef,
      });

      const sourceA = Fs.join(tmpDir, 'out/src/a.md');
      const sourceC = Fs.join(tmpDir, 'out/src/sub/c.md');
      expect((await Fs.readText(sourceA)).data ?? '').to.contain('hello');
      expect((await Fs.readText(sourceC)).data ?? '').to.contain('world');

      const outDir = Fs.join(tmpDir, 'out/sha256');
      const assetsPath = Fs.join(tmpDir, 'out/slug-tree.kb.assets.json');
      const assetsRaw = (await Fs.readText(assetsPath)).data ?? '';
      const assets = Json.parse(assetsRaw) as {
        docid: string;
        entries: Array<Record<string, unknown>>;
      };
      const isAssetsValid = SlugSchema.FileContent.Is.index(assets);
      expect(isAssetsValid).to.eql(true);
      expect(assets.docid).to.eql('slug:test');

      const outputs: Array<{
        name: string;
        data: {
          source: string;
          path?: string;
          hash: string;
          contentType: string;
          frontmatter: { ref: string; title?: string };
        };
      }> = [];
      for await (const entry of Deno.readDir(outDir)) {
        if (!entry.isFile || !entry.name.endsWith('.json')) continue;
        const raw = (await Fs.readText(Fs.join(outDir, entry.name))).data ?? '';
        const data = Json.parse(raw) as {
          source: string;
          path?: string;
          hash: string;
          contentType: string;
          frontmatter: { ref: string; title?: string };
        };
        const validation = SlugSchema.FileContent.validate(data);
        expect(validation.ok).to.eql(true);
        outputs.push({ name: entry.name, data });
      }

      expect(outputs.length).to.eql(2);

      const normalize = (p: string) => {
        let s = p.replaceAll('\\', '/');
        if (s.startsWith('./')) s = s.slice(2);
        return s;
      };

      const byPath = new Map<
        string,
        {
          source: string;
          hash: string;
          name: string;
          contentType: string;
          frontmatter: { ref: string; title?: string };
        }
      >();
      for (const { name, data } of outputs) {
        byPath.set(normalize(String(data.path ?? '')), {
          source: data.source,
          hash: data.hash,
          name,
          contentType: data.contentType,
          frontmatter: data.frontmatter,
        });
      }

      const a = byPath.get('a.md');
      const c = byPath.get('sub/c.md');
      expect(String(a?.source ?? '')).to.contain('hello');
      expect(a?.hash).to.eql(Hash.sha256(String(a?.source ?? '')));
      expect(a?.name).to.eql(`${a?.hash}.json`);
      expect(a?.contentType).to.eql('text/markdown');
      expect(a?.frontmatter.ref).to.eql('crdt:test');
      expect(a?.frontmatter.title).to.eql(undefined);
      expect(String(c?.source ?? '')).to.contain('world');
      expect(c?.hash).to.eql(Hash.sha256(String(c?.source ?? '')));
      expect(c?.name).to.eql(`${c?.hash}.json`);
      expect(c?.contentType).to.eql('text/markdown');
      expect(c?.frontmatter.ref).to.eql('crdt:test');
      expect(c?.frontmatter.title).to.eql(undefined);

      expect((assets?.entries ?? []).length).to.eql(2);
      const assetHashes = new Set(
        (assets.entries ?? []).map((entry) => String((entry as { hash?: unknown }).hash ?? '')),
      );
      expect(assetHashes.has(String(a?.hash ?? ''))).to.eql(true);
      expect(assetHashes.has(String(c?.hash ?? ''))).to.eql(true);
    } finally {
      await Fs.remove(tmpDir);
    }
  });
});
