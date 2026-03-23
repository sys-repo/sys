import { Deps, describe, expect, it, Yaml } from './common.ts';
import type { t } from './common.ts';
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
});
