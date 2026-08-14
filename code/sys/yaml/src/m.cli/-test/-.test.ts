import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { type t } from '../common.ts';
import { YamlConfig } from '../mod.ts';

describe(`yaml: cli tools`, () => {
  it('API', async () => {
    const m = await import('@sys/yaml/cli');
    expect(m.YamlConfig).to.equal(YamlConfig);
    expectTypeOf(YamlConfig).toMatchTypeOf<t.YamlConfig.Lib>();
    expectTypeOf(YamlConfig.File).toMatchTypeOf<t.YamlConfig.File.Lib>();
    expectTypeOf(YamlConfig.Edit).toMatchTypeOf<t.YamlConfig.Edit.Lib>();
    expectTypeOf(YamlConfig.Ref).toMatchTypeOf<t.YamlConfig.Ref.Lib>();
    expectTypeOf(YamlConfig.Env).toMatchTypeOf<t.YamlConfig.Env.Lib>();
    expectTypeOf(YamlConfig.menu).toMatchTypeOf<t.YamlConfig.Menu.Run>();
  });

  it('freezes every namespace API', () => {
    for (
      const namespace of [
        YamlConfig,
        YamlConfig.File,
        YamlConfig.Edit,
        YamlConfig.Ref,
        YamlConfig.Env,
      ]
    ) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
