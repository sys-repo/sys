import { describe, expect, Fs, it, Path, stripAnsi, Testing } from '../../../-test.ts';
import { Deps } from '@sys/esm/deps';
import { DenoDeps } from '../mod.ts';

describe('DenoDeps methods', () => {
  const SAMPLE = {
    path: Path.resolve('./src/-test/sample-2/deps.yaml'),
  };

  describe('compatibility', () => {
    it('adapts the pure manifest methods from @sys/esm/deps', async () => {
      const input = `
        deno.json:
          - import: npm:esbuild@0.27.3
      `;

      const esm = await Deps.from(input);
      const deno = await DenoDeps.from(input);

      expect(deno.error).to.eql(esm.error);
      expect(deno.data?.deps.map((dep) => dep.module.toString())).to.eql(
        esm.data?.entries.map((entry) => entry.module.toString()),
      );
      expect(deno.data?.deps.map((dep) => dep.target)).to.eql(
        esm.data?.entries.map((entry) => entry.target),
      );
      expect(deno.data?.modules.items.map((item) => item.toString())).to.eql(
        esm.data?.modules.items.map((item) => item.toString()),
      );

      const a = DenoDeps.toDep('jsr:@sys/tmp@0.1.2');
      const b = Deps.toEntry('jsr:@sys/tmp@0.1.2');

      expect(a.module.toString()).to.eql(b.module.toString());
      expect(a.target).to.eql(b.target);
      expect(a.dev).to.eql(b.dev);
      expect(a.subpaths).to.eql(b.subpaths);
      expect(DenoDeps.toYaml(deno.data?.deps ?? []).text).to.eql(
        Deps.toYaml(esm.data?.entries ?? []).text,
      );
      expect(DenoDeps.findImport(deno.data?.deps, 'npm:esbuild')).to.eql(
        Deps.findImport(esm.data?.entries, 'npm:esbuild'),
      );
    });
  });

  describe('toYaml', () => {
    it('rejects invalid dependency entries', () => {
      const dep = DenoDeps.toDep('');

      expect(() => DenoDeps.toYaml([dep])).to.throw(
        'Failed to parse ESM module-specifier string ("")',
      );
    });
  });

  describe('Fmt', () => {
    it('renders the first dependency after a registry boundary', () => {
      const text = stripAnsi(
        DenoDeps.Fmt.deps([
          DenoDeps.toDep('jsr:@sys/std@0.0.1'),
          DenoDeps.toDep('npm:react@19.0.0'),
          DenoDeps.toDep('npm:react-dom@19.0.0'),
        ]),
      );

      expect(text).to.match(/0\.0\.1\s+jsr:@sys\/std/);
      expect(text).to.match(/19\.0\.0\s+npm:react/);
      expect(text).to.include('jsr:@sys/std');
      expect(text).to.include('npm:react');
      expect(text).to.include('npm:react-dom');
    });
  });

  describe('toJson("deno.json")', () => {
    it('empty', () => {
      const a = DenoDeps.toJson('deno.json', []);
      const b = DenoDeps.toJson('deno.json');
      expect(a).to.eql({});
      expect(b).to.eql({});
    });

    it('imports', async () => {
      const res = await DenoDeps.from(SAMPLE.path);
      expect(res.error).to.eql(undefined);
      const json = DenoDeps.toJson('deno.json', res.data?.deps);
      expect(json).to.eql({
        imports: {
          '@automerge/automerge': 'npm:@automerge/automerge@2',
          '@automerge/automerge-repo': 'npm:@automerge/automerge-repo@1',
          '@noble/hashes': 'npm:@noble/hashes@1.7.1',
          '@std/assert': 'jsr:@std/assert@1.0.11',
          '@std/fs': 'jsr:@std/fs@1.0.11',
          '@std/http': 'jsr:@std/http@1.0.13',
          chai: 'npm:chai@5',
          'chai/': 'npm:chai@5/',
          'chai/chai.js': 'npm:chai@5/chai.js',
        },
      });
    });

    it('aliases local file-path imports', async () => {
      const fs = await Testing.dir('DenoDeps.toJson.localPaths');
      const typesPath = fs.join('fixtures/local/types.ts');
      const typesFileUrl = String(Fs.Path.toFileUrl(typesPath));
      const res = await DenoDeps.from(`
        deno.json:
          - import: ${typesFileUrl}
            name: '@local/types'
      `);
      const json = DenoDeps.toJson('deno.json', res.data?.deps);

      expect(res.error).to.eql(undefined);
      expect(json).to.eql({
        imports: {
          '@local/types': typesFileUrl,
        },
      });
    });
  });

  describe('toJson("package.json")', () => {
    it('empty', () => {
      const a = DenoDeps.toJson('package.json', []);
      const b = DenoDeps.toJson('package.json');
      expect(a).to.eql({});
      expect(b).to.eql({});
    });

    it('imports', async () => {
      const res = await DenoDeps.from(SAMPLE.path);
      expect(res.error).to.eql(undefined);
      const json = DenoDeps.toJson('package.json', res.data?.deps);

      expect(json).to.eql({
        dependencies: {
          '@std/assert': 'npm:@jsr/std__assert@1.0.11',
          rxjs: '7',
          hono: '4.6',
        },
        devDependencies: {
          '@std/http': 'npm:@jsr/std__http@1.0.13',
          '@types/react': '^18',
        },
      });
    });

    it('skips local file-path imports', async () => {
      const fs = await Testing.dir('DenoDeps.toJson.packageLocalPaths');
      const uiPath = fs.join('fixtures/local/ui/mod.ts');
      const json = DenoDeps.toJson('package.json', [
        DenoDeps.toDep(uiPath, {
          target: 'package.json',
          name: '@local/ui',
        }),
        DenoDeps.toDep('npm:react@19.0.0', { target: 'package.json' }),
      ]);

      expect(json).to.eql({
        dependencies: { react: '19.0.0' },
      });
    });
  });
});
