import { describe, expect, Is, it } from '../../-test.ts';
import { OptimizeImportsPlugin } from '../../m.vite.plugins/m.OptimizeImports/mod.ts';
import { ViteConfig } from '../mod.ts';

describe('ViteConfig.app', () => {
  it('includes optimize-imports before caller-supplied vite plugins', async () => {
    const userPlugin = { name: 'user:plugin' };
    const config = await ViteConfig.app({
      workspace: false,
      plugins: { deno: false, react: false, wasm: false },
      vitePlugins: [userPlugin],
    });

    const plugins = config.plugins ?? [];
    const names = plugins
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .flatMap((entry) => pluginName(entry));

    expect(names).to.eql(['sys:optimize-imports', 'user:plugin']);

    const optimize = firstPlugin(plugins[0]);
    expect(pluginName(optimize)[0]).to.eql(OptimizeImportsPlugin.plugin().name);
    expect(pluginEnforce(optimize)).to.eql('pre');
  });
});

function firstPlugin(input: unknown) {
  return Array.isArray(input) ? input[0] : input;
}

function pluginName(input: unknown) {
  if (!Is.record<Record<string, unknown>>(input)) return [];
  const value = input.name;
  return Is.string(value) ? [value] : [];
}

function pluginEnforce(input: unknown) {
  if (!Is.record<Record<string, unknown>>(input)) return undefined;
  const value = input.enforce;
  return value === 'pre' || value === 'post' ? value : undefined;
}
