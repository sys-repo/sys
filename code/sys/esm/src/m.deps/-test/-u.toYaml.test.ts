import { Deps, describe, expect, it, Yaml } from './common.ts';
import type { t } from './common.ts';
import { toDenoJson } from '../u.toJson.deno.ts';
import { sampleYaml } from './u.fixture.yaml.ts';

describe('Deps state', () => {
  it('modules mirror entries.mapped(module)', async () => {
    const { data } = await Deps.from(sampleYaml());
    const a = data?.modules.items;
    const b = data?.entries.map((entry) => entry.module);
    expect(a).to.eql(b);
  });

  it('toYaml: empty', async () => {
    const test = async (yaml: string) => {
      const { data, error } = await Deps.from(yaml);
      expect(error).to.eql(undefined);

      if (data) {
        const rendered = data.toYaml();
        expect(rendered.text).to.not.include('groups: {}');
        expect(rendered.text).to.include('deno.json: []');
        expect(rendered.text).to.include('package.json: []');
        expect(rendered.text).to.eql(rendered.toString());
      }
    };

    await test('{}');
    await test(`
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

    const { data, error } = await Deps.from(yaml);
    expect(data).to.exist;
    expect(error).to.eql(undefined);

    if (data) {
      const rendered = data.toYaml();
      const parsed = Yaml.parse<typeof rendered.obj>(rendered.text);
      expect(rendered.obj.groups).to.eql(undefined);
      expect(parsed.error).to.eql(undefined);
      expect(rendered.obj).to.eql(parsed.data);
    }
  });

  it('toYaml: preserves Deno import aliases through byte-stable manifest round-trips', async () => {
    const yaml = `
      deno.json:
        - import: npm:@types/mdast@4.0.4
          name: mdast
        - import: npm:@types/mdast@4.0.4
          name: mdast-legacy
        - import: npm:@types/unist@3.0.3
          name: unist
    `;

    const first = await Deps.from(yaml);
    const rendered = first.data?.toYaml();
    const second = await Deps.from(rendered?.text ?? '');
    const rerendered = second.data?.toYaml();

    expect(first.error).to.eql(undefined);
    expect(rendered?.obj['deno.json']).to.eql([
      { import: 'npm:@types/mdast@4.0.4', name: 'mdast' },
      { import: 'npm:@types/mdast@4.0.4', name: 'mdast-legacy' },
      { import: 'npm:@types/unist@3.0.3', name: 'unist' },
    ]);
    expect(second.error).to.eql(undefined);
    expect(toDenoJson(second.data?.entries)).to.eql({
      imports: {
        mdast: 'npm:@types/mdast@4.0.4',
        'mdast-legacy': 'npm:@types/mdast@4.0.4',
        unist: 'npm:@types/unist@3.0.3',
      },
    });
    expect(rerendered?.text).to.eql(rendered?.text);
  });

  it('toYaml: preserves package override policy through state round-trip', async () => {
    const yaml = `
      package.json:
        - import: npm:react@19.2.6
        - overrides:
            monaco-editor:
              dompurify: '3.4.0'
            "@automerge/automerge-repo":
              uuid: '11.1.1'
    `;

    const { data, error } = await Deps.from(yaml);
    expect(data).to.exist;
    expect(error).to.eql(undefined);

    if (data) {
      const rendered = data.toYaml();
      const parsed = await Deps.from(rendered.text);

      expect(rendered.obj['package.json']).to.eql([
        { import: 'npm:react@19.2.6' },
        {
          overrides: {
            '@automerge/automerge-repo': { uuid: '11.1.1' },
            'monaco-editor': { dompurify: '3.4.0' },
          },
        },
      ]);
      expect(parsed.error).to.eql(undefined);
      expect(parsed.data?.packageJson).to.eql(data.packageJson);
    }
  });

  it('toYaml: renders caller-supplied package override policy', () => {
    const rendered = Deps.toYaml([], {
      packageJson: {
        overrides: {
          zed: { beta: '2.0.0', alpha: '1.0.0' },
          alpha: 'npm:alpha@1.0.0',
        },
      },
    });

    expect(rendered.obj['package.json']).to.eql([
      {
        overrides: {
          alpha: 'npm:alpha@1.0.0',
          zed: { alpha: '1.0.0', beta: '2.0.0' },
        },
      },
    ]);
  });

  it('toYaml: grouped and ungrouped round-trip', async () => {
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

    const { data, error } = await Deps.from(yaml);
    expect(data).to.exist;
    expect(error).to.eql(undefined);

    if (data) {
      const groupBy: t.EsmDeps.CategorizeByGroup = (args) => {
        const name = args.entry.module.name;
        if (name.endsWith('/tmp-3')) args.group('common/foo', { dev: true });
        if (name.match(/tmp-(\d+)$/)) args.group('common/foo');
      };

      const rendered = data.toYaml({ groupBy });
      const parsed = Yaml.parse<typeof rendered.obj>(rendered.text);
      expect(parsed.error).to.eql(undefined);
      expect(rendered.obj).to.eql(parsed.data);
    }
  });

  it('toYaml: preserves entry subpaths when rendering back to yaml', async () => {
    const yaml = `
      deno.json:
        - import: jsr:@std/path@1.1.4
          subpaths:
            - join
            - posix/join
            - windows/join
        - import: npm:hono@4.12.9
          subpaths:
            - cors
    `;

    const { data, error } = await Deps.from(yaml);
    expect(data).to.exist;
    expect(error).to.eql(undefined);

    if (data) {
      const rendered = data.toYaml();
      const parsed = Yaml.parse<typeof rendered.obj>(rendered.text);

      expect(parsed.error).to.eql(undefined);
      expect(rendered.obj).to.eql(parsed.data);
      expect(rendered.text).to.include('subpaths: [ join, posix/join, windows/join ]');
      expect(rendered.text).to.include('subpaths: [ cors ]');
    }
  });

  it('toYaml: preserves flat subpath arrays', async () => {
    const yaml = `
      deno.json:
        - import: npm:foo@1.2.3
          subpaths:
            - flat
            - array
    `;

    const { data, error } = await Deps.from(yaml);
    expect(data).to.exist;
    expect(error).to.eql(undefined);

    if (data) {
      const rendered = data.toYaml();
      const parsed = Yaml.parse<typeof rendered.obj>(rendered.text);

      expect(parsed.error).to.eql(undefined);
      expect(rendered.obj).to.eql(parsed.data);
      expect(rendered.text).to.include('subpaths: [ flat, array ]');
    }
  });

  it('toYaml: rejects invalid dependency entries', () => {
    const entry = Deps.toEntry('');

    expect(() => Deps.toYaml([entry])).to.throw(
      'Failed to parse ESM module-specifier string ("")',
    );
  });
});
