import { type t, c, describe, Esm, expect, Fs, it } from '../../-test.ts';
import { Fmt } from './m.Fmt.ts';
import { DenoDeps } from './mod.ts';

describe('DenoDeps', () => {
  const SAMPLE = {
    path: './src/-test/sample-2/deps.yaml',
  };

  it('API', () => {
    expect(DenoDeps.Fmt).to.equal(Fmt);
  });

  describe('DenoDeps.fromYaml', () => {
    it('input: path (string → file.yaml)', async () => {
      const path = SAMPLE.path;
      const res = await DenoDeps.fromYaml(path);

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

      expect(deps[6].target).to.eql(['package.json']);
      expect(deps[7].target).to.eql(['package.json']);
      expect(deps[8].target).to.eql(['package.json']);
      expect(deps[9].target).to.eql(['package.json']);

      const mod = deps[0].module;
      expect(mod.input).to.eql('jsr:@std/assert@1.0.11');
      expect(mod.name).to.eql('@std/assert');
      expect(mod.version).to.eql('1.0.11');
      expect(mod.prefix).to.eql('jsr');
      expect(deps[0].dev).to.eql(undefined);
      expect(deps[0].wildcard).to.eql(undefined);

      const find = (name: string, fn: (dep: t.DenoDep) => void) => {
        const match = deps.find((m) => m.module.name === name);
        if (!match) throw new Error(`Expected to find module: "${name}"`);
        fn(match);
      };

      find('@types/react', (dep) => expect(dep.dev).to.eql(true));
      find('@std/http', (dep) => expect(dep.dev).to.eql(true));
      find('@noble/hashes', (dep) => expect(dep.wildcard).to.eql(true));
      find('@automerge/automerge-repo', (dep) => expect(dep.wildcard).to.eql(true));
    });

    it('input: YAML (string)', async () => {
      const path = SAMPLE.path;
      const yaml = (await Fs.readText(path)).data!;
      const a = await DenoDeps.fromYaml(yaml);
      const b = await DenoDeps.fromYaml(path);

      expect(a.data?.deps).to.eql(b.data?.deps);
      expect(a.error).to.eql(undefined);
      expect(b.error).to.eql(undefined);
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
      const res = await DenoDeps.fromYaml(yaml);
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

      const res = await DenoDeps.fromYaml(yaml);
      const { deps, modules } = res.data!;

      expect(deps.length).to.eql(1);
      expect(deps[0].module.version).to.eql('^0.1.0');
      expect(modules.items[0].version).to.eql('^0.1.0');
    });

    describe('errors', () => {
      it('path: not found', async () => {
        const path = './404.yaml';
        const res = await DenoDeps.fromYaml(path);
        expect(res.error?.message).to.include('Failed to load YAML at path:');
        expect(res.error?.message).to.include(Fs.resolve(path));
      });

      it('invalid YAML: parse error', async () => {
        const yaml = `
          deno.json:
            import: jsr:@sys/tmp@0.0.42
            import: npm:rxjs@7
      `;
        const res = await DenoDeps.fromYaml(yaml);
        expect(res.error?.message).to.include('Failed while parsing given YAML');
        expect(res.error?.cause?.message).to.include('Map keys must be unique');
      });

      it('invalid YAML: module ESM unparsable', async () => {
        const yaml = `
          deno.json:
            - import: jsr:@sys/tmp@0.0.42
            - import: fail:foobar@0.1.2        
        `;
        const res = await DenoDeps.fromYaml(yaml);
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
      const { data } = await DenoDeps.fromYaml(SAMPLE.path);
      expect(data?.modules.items).to.eql(data?.deps.map((m) => m.module));
    });
  });

  describe('DenoDeps:toDenoJson', () => {
    it('empty', () => {
      const a = DenoDeps.toDenoJson([]);
      const b = DenoDeps.toDenoJson();
      expect(a).to.eql({});
      expect(b).to.eql({});
    });

    it('imports', async () => {
      const res = await DenoDeps.fromYaml(SAMPLE.path);
      const json = DenoDeps.toDenoJson(res.data?.deps);

      expect(json).to.eql({
        imports: {
          '@automerge/automerge': 'npm:@automerge/automerge@2',
          '@automerge/automerge-repo': 'npm:@automerge/automerge-repo@1',
          '@automerge/automerge-repo/*': 'npm:@automerge/automerge-repo@1/*',
          '@noble/hashes': 'npm:@noble/hashes@1.7.1',
          '@noble/hashes/*': 'npm:@noble/hashes@1.7.1/*',
          '@std/assert': 'jsr:@std/assert@1.0.11',
          '@std/fs': 'jsr:@std/fs@1.0.11',
          '@std/http': 'jsr:@std/http@1.0.13',
        },
      });
    });
  });

  describe('DenoDeps.toPackageJson', () => {
    it('empty', () => {
      const a = DenoDeps.toPackageJson([]);
      const b = DenoDeps.toPackageJson();
      expect(a).to.eql({});
      expect(b).to.eql({});
    });

    it('imports', async () => {
      const res = await DenoDeps.fromYaml(SAMPLE.path);
      const json = DenoDeps.toPackageJson(res.data!.deps);

      expect(json).to.eql({
        dependencies: {
          '@std/assert': 'npm:@jsr/std__assert@1.0.11',
          '@std/async': 'npm:@jsr/std__async@1.0.10',
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
});
