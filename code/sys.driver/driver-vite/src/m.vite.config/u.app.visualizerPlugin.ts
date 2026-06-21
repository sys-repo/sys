import { type t } from './common.ts';

type VisualizerModule = {
  readonly visualizer: (options: { readonly filename: string }) => t.VitePlugin;
};

/**
 * Lazy wrapper for the optional rollup-plugin-visualizer dependency.
 */
export function visualizerPlugin(filename: string): t.VitePlugin {
  return {
    name: 'visualizer',
    async generateBundle(
      this: t.Rollup.PluginContext,
      outputOptions: t.Rollup.NormalizedOutputOptions,
      outputBundle: t.Rollup.OutputBundle,
      isWrite: boolean,
    ) {
      try {
        const { visualizer } = await import('rollup-plugin-visualizer') as VisualizerModule;
        const plugin = visualizer({ filename }) as t.Rollup.Plugin;
        const hook = plugin.generateBundle;
        if (!hook) return;
        if (typeof hook === 'function') {
          return await hook.call(this, outputOptions, outputBundle, isWrite);
        }
        return await hook.handler.call(this, outputOptions, outputBundle, isWrite);
      } catch (err) {
        if (err instanceof Error && err.name === 'NotCapable') {
          throw new Error(
            'ViteConfig.app visualizer could not load rollup-plugin-visualizer under the current Deno permissions.',
            { cause: err },
          );
        }
        throw err;
      }
    },
  };
}
