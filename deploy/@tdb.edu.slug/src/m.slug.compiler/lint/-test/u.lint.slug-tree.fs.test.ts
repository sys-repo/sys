import { type t, describe, expect, Fs, Hash, it } from '../../-test.ts';
import { Json } from '../common.ts';
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
        facets: ['slug-tree:fs'],
        'slug-tree:fs': {
          source: 'src',
          target: {
            dir: [
              { kind: 'source', path: 'out/src' },
              { kind: 'sha256', path: 'out/sha256' },
            ],
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
      const outputs: Array<{
        name: string;
        data: { source: string; path?: string; hash: string; contentType: string };
      }> = [];
      for await (const entry of Deno.readDir(outDir)) {
        if (!entry.isFile || !entry.name.endsWith('.json')) continue;
        const raw = (await Fs.readText(Fs.join(outDir, entry.name))).data ?? '';
        const data = Json.parse(raw) as {
          source: string;
          path?: string;
          hash: string;
          contentType: string;
        };
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
        { source: string; hash: string; name: string; contentType: string }
      >();
      for (const { name, data } of outputs) {
        byPath.set(normalize(String(data.path ?? '')), {
          source: data.source,
          hash: data.hash,
          name,
          contentType: data.contentType,
        });
      }

      const a = byPath.get('a.md');
      const c = byPath.get('sub/c.md');
      expect(String(a?.source ?? '')).to.contain('hello');
      expect(a?.hash).to.eql(Hash.sha256(String(a?.source ?? '')));
      expect(a?.name).to.eql(`${a?.hash}.json`);
      expect(a?.contentType).to.eql('text/markdown');
      expect(String(c?.source ?? '')).to.contain('world');
      expect(c?.hash).to.eql(Hash.sha256(String(c?.source ?? '')));
      expect(c?.name).to.eql(`${c?.hash}.json`);
      expect(c?.contentType).to.eql('text/markdown');
    } finally {
      await Fs.remove(tmpDir);
    }
  });
});
