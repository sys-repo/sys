import { Is, type t } from '../common.ts';
import react from '@vitejs/plugin-react';
import { ViteTransport } from '../../m.vite.transport/mod.ts';

type CommonPluginsContext = {
  denoConfig?: t.StringPath;
  configDiscovery?: t.ViteTransport.DenoPluginConfigDiscovery;
};

export async function commonPlugins(
  options: t.ViteConfig.CommonPlugins = {},
  context: CommonPluginsContext = {},
) {
  const wasm = (options.wasm ?? true) ? await wrangle.wasmPlugin() : undefined;

  return () => {
    const plugins: t.VitePluginOption[] = [];

    /**
     * The official Deno vite-plugin:
     */
    if (options.deno ?? true) {
      plugins.push(ViteTransport.denoPlugin(wrangle.denoPluginOptions(context)));
    }

    /**
     * WASM support:
     */
    if (wasm) plugins.push(wasm());

    /**
     * React:
     */
    if (options.react ?? true) {
      const exclude = [/node_modules/, /(\.|^)worker\.tsx?$/];
      plugins.push(react({ exclude }));
    }

    return plugins;
  };
}

/**
 * Helpers
 */
const wrangle = {
  denoPluginOptions(context: CommonPluginsContext): t.ViteTransport.DenoPluginOptions {
    return context.denoConfig
      ? { configPath: context.denoConfig }
      : { configDiscovery: context.configDiscovery ?? 'workspace' };
  },

  async wasmPlugin() {
    const loaded = await import('npm:vite-plugin-wasm@3.6.0');
    const plugin = wrangle.pluginFromModule(loaded);
    if (!plugin) throw new Error('Failed to load vite-plugin-wasm from npm runtime entry');
    return plugin;
  },

  pluginFromModule(loaded: unknown) {
    return (Is.func(loaded)
      ? loaded
      : Is.func((loaded as { default?: unknown })?.default)
      ? (loaded as { default: () => t.VitePluginOption }).default
      : undefined) as undefined | (() => t.VitePluginOption);
  },
} as const;
