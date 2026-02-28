import { type t, describe, expect, Fs, Hash, it } from '../../-test.ts';
import { Json, SlugSchema } from '../common.ts';
import { collectDistDirs, writeDistFiles } from '../u.dist.ts';
import { bundleSlugTreeFs } from '../m.bundle.slug-tree.fs/mod.ts';

describe('Lint: slug-tree:fs', () => {
  it('writes sha256 per-file export with source + path + hash', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const srcDir = Fs.join(tmpDir, 'src');
      await Fs.ensureDir(Fs.join(srcDir, 'sub'));

      await Fs.write(Fs.join(srcDir, 'a.md'), 'hello');
      await Fs.write(Fs.join(srcDir, 'b.txt'), 'skip');
      await Fs.write(Fs.join(srcDir, 'sub', 'c.md'), 'world');

      const config: t.SlugBundleFileTree = {
        source: 'src',
        docid: 'sample-foobar',
        target: {
          manifests: 'out/slug-tree.sample-foobar.json',
          dir: [
            { kind: 'source', path: 'out/src' },
            { kind: 'sha256', path: 'out/sha256' },
          ],
        },
      };
      const doc: t.BundleProfile = {
        bundles: [{ kind: 'slug-tree:fs', ...config }],
      };

      await bundleSlugTreeFs({
        cwd: tmpDir,
        config,
      });
      await writeDistFiles(collectDistDirs.fromSlugTreeFs({ cwd: tmpDir, config }));

      const sourceA = Fs.join(tmpDir, 'out/src/a.md');
      const sourceC = Fs.join(tmpDir, 'out/src/sub/c.md');
      expect((await Fs.readText(sourceA)).data ?? '').to.contain('hello');
      expect((await Fs.readText(sourceC)).data ?? '').to.contain('world');
      expect(await Fs.exists(Fs.join(tmpDir, 'out/src/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/sha256/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/dist.json'))).to.eql(true);

      const outDir = Fs.join(tmpDir, 'out/sha256');
      const assetsPath = Fs.join(tmpDir, 'out/slug-tree.sample-foobar.assets.json');
      const assetsRaw = (await Fs.readText(assetsPath)).data ?? '';
      const assets = Json.parse(assetsRaw) as {
        docid: string;
        entries: Array<Record<string, unknown>>;
      };
      const isAssetsValid = SlugSchema.FileContent.Is.index(assets);
      expect(isAssetsValid).to.eql(true);
      expect(assets.docid).to.eql('sample-foobar');

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
        if (entry.name === 'dist.json') continue;
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
      expect(a?.frontmatter.ref).to.eql('crdt:sample-foobar');
      expect(a?.frontmatter.title).to.eql(undefined);
      expect(String(c?.source ?? '')).to.contain('world');
      expect(c?.hash).to.eql(Hash.sha256(String(c?.source ?? '')));
      expect(c?.name).to.eql(`${c?.hash}.json`);
      expect(c?.contentType).to.eql('text/markdown');
      expect(c?.frontmatter.ref).to.eql('crdt:sample-foobar');
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

  it('writes dist.json for manifest directories and bundle root', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const srcDir = Fs.join(tmpDir, 'src');
      await Fs.ensureDir(Fs.join(srcDir, 'sub'));
      await Fs.write(Fs.join(srcDir, 'a.md'), 'alpha');

      const config: t.SlugBundleFileTree = {
        source: 'src',
        target: {
          manifests: ['out/-manifests/slug-tree.kb.json', 'out/-manifests/slug-tree.kb.yaml'],
          dir: [
            { kind: 'source', path: 'out/source' },
            { kind: 'sha256', path: 'out/content' },
          ],
        },
      };

      await bundleSlugTreeFs({
        cwd: tmpDir,
        config,
      });
      await writeDistFiles(collectDistDirs.fromSlugTreeFs({ cwd: tmpDir, config }));

      expect(await Fs.exists(Fs.join(tmpDir, 'out/-manifests/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/source/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/content/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/dist.json'))).to.eql(true);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('derives docid from manifest filename when explicit docid missing', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const srcDir = Fs.join(tmpDir, 'src');
      await Fs.ensureDir(srcDir);
      await Fs.write(Fs.join(srcDir, 'a.md'), 'hello');

      const config: t.SlugBundleFileTree = {
        source: 'src',
        target: {
          manifests: 'out/slug-tree.kb.json',
          dir: [{ kind: 'sha256', path: 'out/sha256' }],
        },
      };
      await bundleSlugTreeFs({
        cwd: tmpDir,
        config,
      });

      const assetsPath = Fs.join(tmpDir, 'out/slug-tree.kb.assets.json');
      const assetsRaw = (await Fs.readText(assetsPath)).data ?? '';
      const assets = Json.parse(assetsRaw) as { docid: string };
      expect(assets.docid).to.eql('kb');
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('skips assets index when sha256 target uses JSON manifest without resolvable docid', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const srcDir = Fs.join(tmpDir, 'src');
      await Fs.ensureDir(srcDir);
      await Fs.write(Fs.join(srcDir, 'a.md'), 'hello');

      const config: t.SlugBundleFileTree = {
        source: 'src',
        target: {
          manifests: 'out/kb.json',
          dir: [{ kind: 'sha256', path: 'out/sha256' }],
        },
      };

      const result = await bundleSlugTreeFs({
        cwd: tmpDir,
        config,
      });

      expect(result?.sha256Files ?? 0).to.eql(1);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/kb.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/sha256'))).to.eql(true);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/kb.assets.json'))).to.eql(false);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('allows JSON manifest without docid when sha256 target is not configured', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const srcDir = Fs.join(tmpDir, 'src');
      await Fs.ensureDir(srcDir);
      await Fs.write(Fs.join(srcDir, 'a.md'), 'hello');

      const config: t.SlugBundleFileTree = {
        source: 'src',
        target: {
          manifests: 'out/kb.json',
        },
      };

      await bundleSlugTreeFs({
        cwd: tmpDir,
        config,
      });

      expect(await Fs.exists(Fs.join(tmpDir, 'out/kb.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/kb.assets.json'))).to.eql(false);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('skips when source directory does not exist', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const config: t.SlugBundleFileTree = {
        source: 'missing',
        target: { manifests: 'out/slug-tree.kb.json' },
      };

      const result = await bundleSlugTreeFs({
        cwd: tmpDir,
        config,
      });

      expect(result).to.eql(undefined);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/slug-tree.kb.json'))).to.eql(false);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('skips when source path is a file', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      await Fs.write(Fs.join(tmpDir, 'source.md'), '# not a directory');
      const config: t.SlugBundleFileTree = {
        source: 'source.md',
        target: { manifests: 'out/slug-tree.kb.json' },
      };

      const result = await bundleSlugTreeFs({
        cwd: tmpDir,
        config,
      });

      expect(result).to.eql(undefined);
      expect(await Fs.exists(Fs.join(tmpDir, 'out/slug-tree.kb.json'))).to.eql(false);
    } finally {
      await Fs.remove(tmpDir);
    }
  });
});
