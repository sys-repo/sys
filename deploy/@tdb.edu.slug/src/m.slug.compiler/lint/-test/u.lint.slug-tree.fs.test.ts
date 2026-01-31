import { type t, describe, expect, Fs, Hash, it } from '../../-test.ts';
import { Json } from '../common.ts';
import { runSlugTreeFs } from '../u.lint.slug-tree.ts';
import { LintProfileSchema } from '../u.schema.ts';

describe('Lint: slug-tree:fs', () => {
  it('writes sha256 flat export with source + path + hash', async () => {
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
            dir: [{ kind: 'sha256', path: 'out/sha256' }],
          },
        },
      };

      await Fs.write(profilePath, LintProfileSchema.stringify(doc));

      await runSlugTreeFs({
        cwd: tmpDir,
        profilePath,
        createCrdt: async () => 'crdt:test' as t.StringRef,
      });

      const outPath = Fs.join(tmpDir, 'out/sha256/slug-tree.sha256.json');
      const raw = (await Fs.readText(outPath)).data ?? '';
      const entries = Json.parse(raw) as Array<{ source: string; path: string; hash: string }>;
      const normalize = (p: string) => {
        let s = p.replaceAll('\\', '/');
        if (s.startsWith('./')) s = s.slice(2);
        return s;
      };

      const byPath = new Map<string, { source: string; hash: string }>();
      for (const item of entries) {
        byPath.set(normalize(item.path), { source: item.source, hash: item.hash });
      }

      expect(byPath.size).to.eql(2);
      const a = byPath.get('a.md');
      const c = byPath.get('sub/c.md');
      expect(String(a?.source ?? '')).to.contain('hello');
      expect(a?.hash).to.eql(Hash.sha256(String(a?.source ?? '')));
      expect(String(c?.source ?? '')).to.contain('world');
      expect(c?.hash).to.eql(Hash.sha256(String(c?.source ?? '')));
    } finally {
      await Fs.remove(tmpDir);
    }
  });
});
