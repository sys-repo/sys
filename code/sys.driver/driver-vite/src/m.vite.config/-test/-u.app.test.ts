import { describe, expect, Fs, Is, it, SAMPLE } from '../../-test.ts';
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

    expect(names).to.eql(['sys:optimize-imports', 'user:plugin', 'sys:oxc-preflight']);

    const optimize = firstPlugin(plugins[0]);
    expect(pluginName(optimize)[0]).to.eql(OptimizeImportsPlugin.plugin().name);
    expect(pluginEnforce(optimize)).to.eql('pre');
  });

  it('applies derived optimize-imports to the published ui-components sample entry', async () => {
    const config = await ViteConfig.app({
      plugins: { deno: false, react: false, wasm: false },
    });
    const source = (await Fs.readText(`${SAMPLE.Dirs.samplePublishedUiComponents}/main.tsx`)).data ?? '';
    const optimize = firstPlugin(config.plugins?.[0]);
    const transform = asTransform(pluginTransform(optimize));
    const result = await transform(source, '/tmp/main.tsx');

    expect(Is.object(result)).to.eql(true);
    if (!result || typeof result === 'string') throw new Error('Expected transform result object');
    expect(result.code.includes('ui-react-devharness/hooks')).to.eql(true);
    expect(result.code.includes('ui-react-components/button')).to.eql(true);
    expect(result.code.includes(`from '@sys/ui-react-devharness'`)).to.eql(false);
    expect(result.code.includes(`from "@sys/ui-react-devharness"`)).to.eql(false);
  });

  it('can disable optimize-imports for on/off proofing', async () => {
    const config = await ViteConfig.app({
      plugins: { deno: false, react: false, wasm: false, optimizeImports: false },
    });
    const source = (await Fs.readText(`${SAMPLE.Dirs.samplePublishedUiComponents}/main.tsx`)).data ?? '';
    const plugins = config.plugins ?? [];
    const names = plugins
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .flatMap((entry) => pluginName(entry));
    const optimize = plugins.flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .find((entry) => pluginName(entry)[0] === 'sys:optimize-imports');

    expect(names.includes('sys:optimize-imports')).to.eql(false);
    expect(optimize).to.eql(undefined);
    expect(source.includes(`from '@sys/ui-react-components/button'`)).to.eql(true);
    expect(source.includes(`from '@sys/ui-react-devharness'`)).to.eql(true);
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

function pluginTransform(input: unknown) {
  if (!Is.record<Record<string, unknown>>(input)) return undefined;
  return input.transform;
}

function asTransform(transform: unknown) {
  if (!transform) throw new Error('Expected transform hook');
  if (typeof transform === 'function') return transform;
  if (Is.record<Record<string, unknown>>(transform) && typeof transform.handler === 'function') {
    return transform.handler;
  }
  throw new Error('Expected callable transform hook');
}
