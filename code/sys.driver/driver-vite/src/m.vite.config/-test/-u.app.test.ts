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

    expect(names).to.eql([
      'sys:dispose-protocol-compat',
      'sys:optimize-imports',
      'user:plugin',
      'sys:oxc-preflight',
    ]);

    const optimize = plugins.flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .find((entry) => pluginName(entry)[0] === 'sys:optimize-imports');
    expect(pluginName(optimize)[0]).to.eql(OptimizeImportsPlugin.plugin().name);
    expect(pluginEnforce(optimize)).to.eql('pre');
  });

  it('keeps the published ui-components sample entry already narrow', async () => {
    const config = await ViteConfig.app({
      plugins: { deno: false, react: false, wasm: false },
    });
    const source =
      (await Fs.readText(`${SAMPLE.Dirs.samplePublishedUiComponents}/main.tsx`)).data ?? '';
    const optimize = (config.plugins ?? [])
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .find((entry) => pluginName(entry)[0] === 'sys:optimize-imports');
    const transform = asTransform(pluginTransform(optimize));
    const result = await transform(source, '/tmp/main.tsx');

    expect(result).to.eql(null);
    expect(source.includes('ui-dev/react/devharness/hooks')).to.eql(true);
    expect(source.includes('ui-components/react/button')).to.eql(true);
    expect(source.includes(`from '@sys/ui-dev';`)).to.eql(false);
    expect(source.includes(`from "@sys/ui-dev";`)).to.eql(false);
  });

  it('can disable optimize-imports for on/off proofing', async () => {
    const config = await ViteConfig.app({
      plugins: { deno: false, react: false, wasm: false, optimizeImports: false },
    });
    const source =
      (await Fs.readText(`${SAMPLE.Dirs.samplePublishedUiComponents}/main.tsx`)).data ?? '';
    const plugins = config.plugins ?? [];
    const names = plugins
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .flatMap((entry) => pluginName(entry));
    const optimize = plugins.flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .find((entry) => pluginName(entry)[0] === 'sys:optimize-imports');

    expect(names.includes('sys:optimize-imports')).to.eql(false);
    expect(optimize).to.eql(undefined);
    expect(source.includes(`from '@sys/ui-components/react/button'`)).to.eql(true);
    expect(source.includes(`from '@sys/ui-dev/react/devharness/hooks'`)).to.eql(true);
  });
});

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
  if (Is.func(transform)) return transform;
  if (Is.record<Record<string, unknown>>(transform) && Is.func(transform.handler)) {
    return transform.handler;
  }
  throw new Error('Expected callable transform hook');
}
