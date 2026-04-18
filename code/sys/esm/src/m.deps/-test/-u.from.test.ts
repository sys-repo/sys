import { c, Deps, describe, expect, Fs, it, Testing } from './common.ts';
import { toDenoJson } from '../u.toJson.deno.ts';
import { sampleYaml } from './u.fixture.yaml.ts';

describe('Deps.from', () => {
  it('input: path (string → file.yaml)', async () => {
    const fs = await Testing.dir('EsmDeps.from.path');
    const path = fs.join('deps.yaml');
    const yaml = sampleYaml();
    await Fs.write(path, yaml);

    const res = await Deps.from(path);
    const entries = res.data?.entries ?? [];

    console.info(c.brightCyan('Sample YAML:'), c.gray(path));
    console.info(c.italic(c.yellow(yaml)));

    expect(res.error).to.eql(undefined);
    expect(entries.length).to.eql(10);

    const names = entries.map((entry) => entry.module.toString());
    expect(names).to.eql([...new Set(names)]);

    expect(entries[0].target).to.eql(['deno.json', 'package.json']);
    expect(entries[1].target).to.eql(['deno.json', 'package.json']);
    expect(entries[2].target).to.eql(['deno.json']);
    expect(entries[7].target).to.eql(['package.json']);

    const mod = entries[0].module;
    expect(mod.input).to.eql('jsr:@std/assert@1.0.11');
    expect(mod.name).to.eql('@std/assert');
    expect(mod.version).to.eql('1.0.11');
    expect(mod.registry).to.eql('jsr');
    expect(entries[0].dev).to.eql(undefined);

    const find = (name: string, fn: (entry: (typeof entries)[number]) => void) => {
      const match = entries.find((entry) => entry.module.name === name);
      if (!match) throw new Error(`Expected to find module: "${name}"`);
      fn(match);
    };

    find('@types/react', (entry) => expect(entry.dev).to.eql(true));
    find('@std/http', (entry) => expect(entry.dev).to.eql(true));
    find('chai', (entry) => expect(entry.subpaths).to.eql(['', 'chai.js']));
  });

  it('input: YAML (string)', async () => {
    const yaml = sampleYaml();
    const a = await Deps.from(yaml);

    const fs = await Testing.dir('EsmDeps.from.string');
    const path = fs.join('deps.yaml');
    await Fs.write(path, yaml);
    const b = await Deps.from(path);

    expect(a.error).to.eql(undefined);
    expect(b.error).to.eql(undefined);

    const aa = a.data?.modules.items.map((item) => item.name);
    const bb = b.data?.modules.items.map((item) => item.name);
    expect(aa).to.eql(bb);
  });

  it('unknown item keys are ignored', async () => {
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
    const res = await Deps.from(yaml);
    expect(res.error).to.eql(undefined);
    expect(res.data?.modules.count).to.eql(2);
  });

  it('de-dupes to the latest version', async () => {
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

    const res = await Deps.from(yaml);
    const { entries, modules } = res.data!;

    expect(entries.length).to.eql(1);
    expect(entries[0].module.version).to.eql('^0.1.0');
    expect(modules.items[0].version).to.eql('^0.1.0');
  });

  it('preserves registry boundaries for the same package name', async () => {
    const yaml = `
      deno.json:
        - import: jsr:@scope/foo@1.2.3
        - import: npm:@scope/foo@4.5.6
        - import: jsr:@scope/foo@1.2.4
    `;

    const res = await Deps.from(yaml);
    const entries = res.data?.entries ?? [];

    expect(res.error).to.eql(undefined);
    expect(entries.length).to.eql(2);

    const jsr = entries.find((entry) => entry.module.registry === 'jsr' && entry.module.name === '@scope/foo');
    const npm = entries.find((entry) => entry.module.registry === 'npm' && entry.module.name === '@scope/foo');

    expect(jsr?.module.version).to.eql('1.2.4');
    expect(npm?.module.version).to.eql('4.5.6');
  });

  it('merges duplicate entry metadata when versions collapse to one module', async () => {
    const yaml = `
      deno.json:
        - import: jsr:@scope/foo@1.2.3
          subpaths: [v1]

      package.json:
        - import: jsr:@scope/foo@1.2.4
          dev: true
          subpaths: [v2]
    `;

    const res = await Deps.from(yaml);
    const entry = res.data?.entries[0];

    expect(res.error).to.eql(undefined);
    expect(res.data?.entries.length).to.eql(1);
    expect(entry?.module.version).to.eql('1.2.4');
    expect(entry?.target).to.eql(['deno.json', 'package.json']);
    expect(entry?.dev).to.eql(true);
    expect(entry?.subpaths).to.eql(['v1', 'v2']);
  });

  it('parses local file-path imports with alias names for deno.json import maps', async () => {
    const fs = await Testing.dir('EsmDeps.from.localPaths');
    const typesPath = fs.join('fixtures/local/types.ts');
    const uiPath = fs.join('fixtures/local/ui/mod.ts');
    const typesFileUrl = String(Fs.Path.toFileUrl(typesPath));
    const yaml = `
      deno.json:
        - import: ${typesFileUrl}
          name: '@local/types'
        - import: ${uiPath}
          name: '@local/ui'
    `;

    const res = await Deps.from(yaml);
    const entries = res.data?.entries ?? [];
    const json = toDenoJson(entries);

    expect(res.error).to.eql(undefined);
    expect(entries.map((entry) => ({
      alias: entry.module.alias,
      input: entry.module.input,
      name: entry.module.name,
      registry: entry.module.registry,
      subpath: entry.module.subpath,
      version: entry.module.version,
    }))).to.eql([
      {
        alias: '@local/types',
        input: typesFileUrl,
        name: typesFileUrl,
        registry: '',
        subpath: '',
        version: '',
      },
      {
        alias: '@local/ui',
        input: uiPath,
        name: uiPath,
        registry: '',
        subpath: '',
        version: '',
      },
    ]);
    expect(json.imports).to.eql({
      '@local/types': typesFileUrl,
      '@local/ui': uiPath,
    });
  });

  it('errors: path not found', async () => {
    const path = './404.yaml';
    const res = await Deps.from(path);
    expect(res.error?.message).to.include('Failed to load YAML at path:');
  });

  it('errors: invalid YAML parse error', async () => {
    const yaml = `
      deno.json:
        import: jsr:@sys/tmp@0.0.42
        import: npm:rxjs@7
    `;
    const res = await Deps.from(yaml);
    expect(res.error?.message).to.include('Failed while parsing given YAML');
    expect(res.error?.cause?.message).to.include('Map keys must be unique');
  });

  it('errors: bare @ alias names must be quoted YAML strings', async () => {
    const yaml = `
      deno.json:
        - import: jsr:@sys/tmp@0.0.42
          name: @sys/tmp
    `;

    const res = await Deps.from(yaml);

    expect(res.error?.message).to.include('Failed while parsing given YAML');
    expect(res.error?.cause?.message).to.include('Plain value cannot start with reserved character @');
  });

  it('errors: invalid ESM import is captured without dropping the rest', async () => {
    const yaml = `
      deno.json:
        - import: jsr:@sys/tmp@0.0.42
        - import: fail:foobar@0.1.2
    `;
    const res = await Deps.from(yaml);
    expect(res.error?.message).to.include('Failed to parse ESM module-specifier');
    expect(res.error?.message).to.include('"fail:foobar@0.1.2"');

    const entries = res.data?.entries ?? [];
    expect(entries[0].module.error).to.eql(undefined);
    expect(entries[1].module.error?.message).to.include('Failed to parse ESM module-specifier');
  });
});
