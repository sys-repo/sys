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

      const find = (name: string, fn: (dep: t.Dep) => void) => {
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
      console.info(c.yellow(c.italic(yaml.text)));
      console.info();
    };

    it('empty', async () => {
      const yaml = `
        groups:
        deno.json:
        package.json:
      `;
      const { data, error } = await DenoDeps.from(yaml);
      expect(error).to.eql(undefined);

      if (data) {
        const yaml = data.toYaml();
        print(yaml, `deps.toYaml() ← (${c.bold('empty')})`);
        expect(yaml.text).to.include('groups: {}');
        expect(yaml.text).to.include('deno.json: []');
        expect(yaml.text).to.include('package.json: []');
        expect(yaml.text).to.eql(yaml.toString());
      }
    });

    it('yaml object and text: grouped/ungrouped', async () => {
      const yaml = `
        groups:
          common/foo:
            - import: jsr:@sample/tmp-1
            - import: jsr:@sample/tmp-2
            - import: jsr:@sample/tmp-3
              dev: true
            
        deno.json:
          - group: common/foo
          - import: jsr:@sample/foobar-1
            wildcard: true

        package.json:
          - group: common/foo
          - import: jsr:@sample/foobar-2
            dev: true

      `;

      const { data, error } = await DenoDeps.from(yaml);
      expect(error).to.eql(undefined);

      if (data) {
        const ungrouped = data.toYaml();
        const grouped = data.toYaml({
          groupBy(dep) {
            const name = dep.module.name;
            if (name.match(/tmp-(\d+)$/)) return 'common/foo';
          },
        });

        print(ungrouped, `data.toYaml ← (${c.bold('ungrouped')})`);
        console.info();
        print(grouped, `data.toYaml ← (${c.bold('grouped')}):`);

        expect(grouped.text).to.eql(grouped.toString());
        expect(ungrouped.text).to.eql(ungrouped.toString());
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
