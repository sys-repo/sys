import { type t, c, describe, Esm, expect, Fs, Is, it, stripAnsi, Testing, Yaml } from '../../-test.ts';
import { Fmt } from './m.Fmt.ts';
import { DenoDeps } from './mod.ts';
import { DenoFile } from '../m.DenoFile/mod.ts';

describe('DenoDeps', () => {
  const SAMPLE = {
    path: './src/-test/sample-2/deps.yaml',
  };

  it('API', () => {
    expect(DenoDeps.Fmt).to.equal(Fmt);
    expect(Is.func(DenoDeps.apply)).to.eql(true);
  });

  describe('DenoDeps.Fmt', () => {
    it('renders the first dependency after a registry boundary', () => {
      const text = stripAnsi(DenoDeps.Fmt.deps([
        DenoDeps.toDep('jsr:@sys/std@0.0.1'),
        DenoDeps.toDep('npm:react@19.0.0'),
        DenoDeps.toDep('npm:react-dom@19.0.0'),
      ]));

      expect(text).to.match(/JSR\s+0\.0\.1\s+@sys\/std/);
      expect(text).to.match(/NPM\s+19\.0\.0\s+react/);
      expect(text).to.include('@sys/std');
      expect(text).to.include('react');
      expect(text).to.include('react-dom');
    });
  });

  describe('DepDeps.toDep', () => {
    it('from string', () => {
      const esm = 'jsr:@sys/tmp@0.1.2';
      const a = DenoDeps.toDep(esm);
      const b = DenoDeps.toDep(esm, { target: 'package.json' });
      const c = DenoDeps.toDep(esm, { target: ['package.json', 'deno.json'] });
      const d = DenoDeps.toDep(esm, { dev: true, subpaths: ['v2', 'http'] });

      expect(a.module.toString()).to.eql(esm);
      expect(b.module.input).to.eql(esm);
      expect(c.module.version).to.eql('0.1.2');

      expect(a.target).to.eql(['deno.json']);
      expect(b.target).to.eql(['package.json']);
      expect(c.target).to.eql(['deno.json', 'package.json']); // NB: sorted

      expect([a.dev, a.subpaths]).to.eql([undefined, undefined]);
      expect([d.dev, d.subpaths]).to.eql([true, ['v2', 'http']]);
    });

    it('from {EsmImport}', () => {
      const esm = Esm.parse('jsr:@sys/tmp@0.1.2');
      const a = DenoDeps.toDep(esm);
      const b = DenoDeps.toDep(esm, { target: 'package.json', dev: true });
      const c = DenoDeps.toDep(esm, { subpaths: ['  '] });
      const d = DenoDeps.toDep(esm, { subpaths: ['', '//foo/bar//', ' v2 '] });

      expect(a.module.toString()).to.eql(esm.toString());
      expect(b.module.toString()).to.eql(esm.toString());
      expect(c.module.toString()).to.eql(esm.toString());

      expect([a.dev]).to.eql([undefined]);
      expect([b.dev]).to.eql([true]);
      expect([c.dev, c.subpaths]).to.eql([undefined, undefined]);
      expect(d.subpaths).to.eql(['foo/bar', 'v2']);
    });
  });

  describe('DenoDeps.findImport', () => {
    it('returns the canonical npm import for a versionless stem', async () => {
      const { data, error } = await DenoDeps.from(`
        deno.json:
          - import: npm:esbuild@0.27.3
      `);
      expect(error).to.eql(undefined);

      const res = DenoDeps.findImport(data?.deps, 'npm:esbuild');
      expect(res).to.eql('npm:esbuild@0.27.3');
    });

    it('returns the canonical jsr import for a versionless stem', async () => {
      const { data, error } = await DenoDeps.from(`
        deno.json:
          - import: jsr:@sys/http@0.0.216
      `);
      expect(error).to.eql(undefined);

      const res = DenoDeps.findImport(data?.deps, 'jsr:@sys/http');
      expect(res).to.eql('jsr:@sys/http@0.0.216');
    });

    it('returns undefined when no matching import exists', async () => {
      const { data, error } = await DenoDeps.from(`
        deno.json:
          - import: npm:vite@7.3.1
      `);
      expect(error).to.eql(undefined);

      const res = DenoDeps.findImport(data?.deps, 'npm:esbuild');
      expect(res).to.eql(undefined);
    });
  });

  describe('DenoDeps.from (YAML)', () => {
    it('input: path (string → file.yaml)', async () => {
      const path = SAMPLE.path;
      const res = await DenoDeps.from(path);

      const yaml = (await Fs.readText(path)).data ?? '';
      console.info(c.brightCyan(`Sample YAML:`), c.gray(path));
      console.info(c.italic(c.yellow(yaml)));

      const deps = res.data?.deps ?? [];
      expect(res.error).to.eql(undefined);
      expect(deps.length).to.eql(10); // NB: de-duped.

      const names = deps.map((m) => Esm.toString(m.module));
      expect(names).to.eql([...new Set(names)]); // NB: unique (no duplicates).

      expect(deps[0].target).to.eql(['deno.json', 'package.json']);
      expect(deps[1].target).to.eql(['deno.json', 'package.json']);
      expect(deps[2].target).to.eql(['deno.json']);
      expect(deps[3].target).to.eql(['deno.json']);
      expect(deps[4].target).to.eql(['deno.json']);
      expect(deps[5].target).to.eql(['deno.json']);

      expect(deps[7].target).to.eql(['package.json']);
      expect(deps[8].target).to.eql(['package.json']);
      expect(deps[9].target).to.eql(['package.json']);

      const mod = deps[0].module;
      expect(mod.input).to.eql('jsr:@std/assert@1.0.11');
      expect(mod.name).to.eql('@std/assert');
      expect(mod.version).to.eql('1.0.11');
      expect(mod.registry).to.eql('jsr');
      expect(deps[0].dev).to.eql(undefined);

      const find = (name: string, fn: (dep: t.Dep) => void) => {
        const match = deps.find((m) => m.module.name === name);
        if (!match) throw new Error(`Expected to find module: "${name}"`);
        fn(match);
      };

      find('@types/react', (dep) => expect(dep.dev).to.eql(true));
      find('@std/http', (dep) => expect(dep.dev).to.eql(true));
      find('chai', (dep) => expect(dep.subpaths).to.eql(['', 'chai.js']));
    });

    it('input: YAML (string)', async () => {
      const path = SAMPLE.path;
      const yaml = (await Fs.readText(path)).data!;

      const a = await DenoDeps.from(yaml);
      const b = await DenoDeps.from(path);
      expect(a.error).to.eql(undefined);
      expect(b.error).to.eql(undefined);

      const aa = a.data?.modules.items.map((m) => m.name);
      const bb = b.data?.modules.items.map((m) => m.name);
      expect(aa).to.eql(bb);
    });

    it('input: YAML (string) - unknown item keys ignored', async () => {
      const yaml = `
        foo: yolo
        deno.json:
          - foo: 123
          - bar: xxx
          - foo: 456
          - import: jsr:@sys/tmp@0.0.42
          - import: npm:rxjs@7
          - baz: 0
      `;
      const res = await DenoDeps.from(yaml);
      const deps = res.data;
      expect(res.error).to.eql(undefined);
      expect(deps?.modules.count).to.eql(2);
    });

    it('input: de-dupe → to: "<module>@<latest>"', async () => {
      const yaml = `
        groups:
          foobar:
            - import: jsr:@sys/tmp@^0.1.0

        deno.json:
          - group: foobar
          - import: jsr:@sys/tmp@0.0.5
          - import: jsr:@sys/tmp@0.0.4

        package.json:
          - import: jsr:@sys/tmp@0.0.5
          - import: jsr:@sys/tmp
      `;

      const res = await DenoDeps.from(yaml);
      const { deps, modules } = res.data!;

      expect(deps.length).to.eql(1);
      expect(deps[0].module.version).to.eql('^0.1.0');
      expect(modules.items[0].version).to.eql('^0.1.0');
    });

    it('groups: dev (flag) on ref → package.json:devDependencies', async () => {
      const yaml = `
        groups:
          foobar:
            - import: jsr:@sys/foo@1
            - import: jsr:@sys/bar@1

        package.json:
          - group: foobar
            dev: true
        `;
      const res = await DenoDeps.from(yaml);
      const { deps, modules } = res.data!;
      expect(deps.every((m) => m.dev === true)).to.eql(true);
    });

    describe('errors', () => {
      it('path: not found', async () => {
        const path = './404.yaml';
        const res = await DenoDeps.from(path);
        expect(res.error?.message).to.include('Failed to load YAML at path:');
        expect(res.error?.message).to.include(Fs.resolve(path));
      });

      it('invalid YAML: parse error', async () => {
        const yaml = `
          deno.json:
            import: jsr:@sys/tmp@0.0.42
            import: npm:rxjs@7
      `;
        const res = await DenoDeps.from(yaml);
        expect(res.error?.message).to.include('Failed while parsing given YAML');
        expect(res.error?.cause?.message).to.include('Map keys must be unique');
      });

      it('invalid YAML: module ESM unparsable', async () => {
        const yaml = `
          deno.json:
            - import: jsr:@sys/tmp@0.0.42
            - import: fail:foobar@0.1.2        
        `;
        const res = await DenoDeps.from(yaml);
        expect(res.error?.message).to.include('Failed to parse ESM module-specifier');
        expect(res.error?.message).to.include('"fail:foobar@0.1.2"');

        const deps = res.data?.deps ?? [];
        expect(deps[0].module.error).to.eql(undefined);
        expect(deps[1].module.error?.message).to.include(`Failed to parse ESM module-specifier`);
      });
    });
  });

  describe('DenoDeps/instance: deps.modules ← filtered', () => {
    it('modules == deps (mapped)', async () => {
      const { data } = await DenoDeps.from(SAMPLE.path);
      const a = data?.modules.items;
      const b = data?.deps.map((m) => m.module);
      expect(a).to.eql(b);
    });
  });

  describe('DenoDeps/instance: deps.yaml', () => {
    const print = (yaml: t.DepsYaml, title = '') => {
      const type = 't.DepsYaml:';
      title = title || 'deps.toYaml().text:';
      console.info();
      console.info(c.brightCyan(c.bold(type)), c.white(title));
      console.info(c.yellow(c.italic(yaml.text.trim())));
      console.info();
    };

    it('toYaml: empty', async () => {
      const test = async (yaml: string) => {
        const { data, error } = await DenoDeps.from(yaml);
        expect(error).to.eql(undefined);

        if (data) {
          const yaml = data.toYaml();
          print(yaml, `deps.toYaml() ← (${c.bold('empty')})`);
          expect(yaml.text).to.not.include('groups: {}');
          expect(yaml.text).to.include('deno.json: []');
          expect(yaml.text).to.include('package.json: []');
          expect(yaml.text).to.eql(yaml.toString());
        }
      };
      test('{}');
      test(`
        groups:
        deno.json:
        package.json:
      `);
    });

    it('toYaml: no groups', async () => {
      const yaml = `
      deno.json:
        - import: jsr:@sample/tmp-1
        - import: jsr:@sample/tmp-2
        - import: jsr:@sample/foobar-1
      package.json:
        - import: jsr:@sample/tmp-1
        - import: jsr:@sample/foobar-2
          dev: true
    `;

      const { data, error } = await DenoDeps.from(yaml);
      expect(data).to.exist;
      expect(error).to.eql(undefined);

      if (data) {
        const yaml = data.toYaml();
        const parsed = Yaml.parse<typeof yaml.obj>(yaml.text);
        print(yaml, `data.toYaml ← (${c.bold('ungrouped')})`);
        expect(yaml.obj.groups).to.eql(undefined); //      NB: no groups.
        expect(parsed.error).to.eql(undefined);
        expect(yaml.obj).to.eql(parsed.data); // NB: no data loss (exact match).
      }
    });

    it('yaml object and text: grouped/ungrouped', async () => {
      const yaml = `
        groups:
          common/foo:
            - import: jsr:@sample/tmp-1
            - import: jsr:@sample/tmp-2
            - import: jsr:@sample/tmp-3
            
        deno.json:
          - group: common/foo
          - import: jsr:@sample/foobar-1

        package.json:
          - import: jsr:@sample/foobar-2
          - group: common/foo
            dev: true

      `;

      const { data, error } = await DenoDeps.from(yaml);
      expect(data).to.exist;
      expect(error).to.eql(undefined);

      const groupBy: t.DepsCategorizeByGroup = (e) => {
        const name = e.dep.module.name;
        if (name.endsWith('/tmp-3')) e.group('common/foo', { dev: true });
        if (name.match(/tmp-(\d+)$/)) e.group('common/foo'); // NB: de-duped in algorithm.
      };

      if (data) {
        const yaml = data.toYaml({ groupBy });
        const parsed = Yaml.parse<typeof yaml.obj>(yaml.text);
        print(yaml, `data.toYaml ← (${c.bold('grouped')}):`);
        expect(parsed.error).to.eql(undefined);
        expect(yaml.obj).to.eql(parsed.data); // NB: no data loss (exact match).
      }
    });
  });

  describe('DenoDeps:toJson("deno.json")', () => {
    it('empty', () => {
      const a = DenoDeps.toJson('deno.json', []);
      const b = DenoDeps.toJson('deno.json');
      expect(a).to.eql({});
      expect(b).to.eql({});
    });

    it('imports', async () => {
      const res = await DenoDeps.from(SAMPLE.path);
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
  });

  describe('DenoDeps.toJson("package.json")', () => {
    it('empty', () => {
      const a = DenoDeps.toJson('package.json', []);
      const b = DenoDeps.toJson('package.json');
      expect(a).to.eql({});
      expect(b).to.eql({});
    });

    it('imports', async () => {
      const res = await DenoDeps.from(SAMPLE.path);
      const json = DenoDeps.toJson('package.json', res.data!.deps);

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
  });

  describe('DenoDeps.apply', () => {
    type ImportMapJson = { imports?: Record<string, string>; scopes?: Record<string, unknown> };

    it('writes inline imports when no importMap is declared', async () => {
      const fs = await Testing.dir('DenoDeps.apply.inline');
      const denoPath = fs.join('deno.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, { name: 'inline-app', tasks: { dev: 'deno task dev' } });

      const res = await DenoDeps.apply(denoPath, [dep]);
      const file = await DenoFile.load(denoPath);

      expect(res.kind).to.eql('imports');
      expect(res.targetPath).to.eql(denoPath);
      expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
      expect(file.data?.imports).to.eql({
        '@std/path': 'jsr:@std/path@1.0.8',
      });
    });

    it('writes to the referenced importMap file when configured', async () => {
      const fs = await Testing.dir('DenoDeps.apply.importMap');
      const denoPath = fs.join('deno.json');
      const importMapPath = fs.join('config/imports.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, {
        name: 'import-map-app',
        importMap: './config/imports.json',
        tasks: { dev: 'deno task dev' },
      });
      await Fs.writeJson(importMapPath, { scopes: { '/foo': { bar: 'baz' } } });

      const res = await DenoDeps.apply(denoPath, [dep]);
      const file = await DenoFile.load(denoPath);
      const importMap = await Fs.readJson<ImportMapJson>(importMapPath);

      expect(res.kind).to.eql('importMap');
      expect(res.targetPath).to.eql(importMapPath);
      expect(file.data?.importMap).to.eql('./config/imports.json');
      expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
      expect(file.data?.imports).to.eql(undefined);
      expect(importMap.data).to.eql({
        imports: {
          '@std/path': 'jsr:@std/path@1.0.8',
        },
        scopes: {
          '/foo': { bar: 'baz' },
        },
      });
    });

    it('prefers importMap over inline imports when both are present', async () => {
      const fs = await Testing.dir('DenoDeps.apply.preferImportMap');
      const denoPath = fs.join('deno.json');
      const importMapPath = fs.join('imports.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, {
        name: 'dual-app',
        importMap: './imports.json',
        imports: { stale: 'jsr:@std/fmt@1.0.0' },
      });

      const res = await DenoDeps.apply(denoPath, [dep]);
      const file = await DenoFile.load(denoPath);
      const importMap = await Fs.readJson<{ imports?: Record<string, string> }>(importMapPath);

      expect(res.kind).to.eql('importMap');
      expect(file.data?.imports).to.eql(undefined);
      expect(importMap.data).to.eql({
        imports: {
          '@std/path': 'jsr:@std/path@1.0.8',
        },
      });
    });

    it('clears inline imports when no deno imports remain', async () => {
      const fs = await Testing.dir('DenoDeps.apply.clearInline');
      const denoPath = fs.join('deno.json');

      await Fs.writeJson(denoPath, {
        name: 'inline-clear-app',
        tasks: { dev: 'deno task dev' },
        imports: { stale: 'jsr:@std/fmt@1.0.0' },
      });

      const res = await DenoDeps.apply(denoPath, []);
      const file = await DenoFile.load(denoPath);

      expect(res.kind).to.eql('imports');
      expect(res.imports).to.eql({});
      expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
      expect(file.data?.imports).to.eql(undefined);
    });

    it('clears importMap imports when no deno imports remain and preserves other keys', async () => {
      const fs = await Testing.dir('DenoDeps.apply.clearImportMap');
      const denoPath = fs.join('deno.json');
      const importMapPath = fs.join('imports.json');

      await Fs.writeJson(denoPath, {
        name: 'import-map-clear-app',
        importMap: './imports.json',
      });
      await Fs.writeJson(importMapPath, {
        imports: { stale: 'jsr:@std/fmt@1.0.0' },
        scopes: { '/foo': { bar: 'baz' } },
      });

      const res = await DenoDeps.apply(denoPath, []);
      const file = await DenoFile.load(denoPath);
      const importMap = await Fs.readJson<ImportMapJson>(importMapPath);

      expect(res.kind).to.eql('importMap');
      expect(res.imports).to.eql({});
      expect(file.data?.imports).to.eql(undefined);
      expect(importMap.data).to.eql({
        scopes: {
          '/foo': { bar: 'baz' },
        },
      });
    });
  });
});
