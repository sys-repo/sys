import { Is, Path, type t } from './common.ts';
import { finalizeIntegrityHtml, validateIntegrityInputs } from './u.html.ts';
import { refuse } from './u.url.ts';

/**
 * Build-only integrity for HTML-linked modules and stylesheets.
 */
export const HtmlIntegrity: t.VitePlugins.HtmlIntegrity.Lib = {
  plugin() {
    let config: t.ViteResolvedConfig;
    let isCSSRequest: (url: string) => boolean;
    const plugin: t.VitePlugin = {
      name: 'sys:html-integrity',
      apply: 'build',
      enforce: 'post',
      async configResolved(value) {
        config = value;
        if (config.build.ssr || config.build.lib || config.experimental.renderBuiltUrl) {
          throw new Error(
            '[sys:html-integrity] SSR, library, and renderBuiltUrl builds are unsupported',
          );
        }
        if (config.html?.additionalAssetSources) {
          refuse('', '', 'custom HTML asset sources are unsupported');
        }
        const index = config.plugins.indexOf(plugin);
        if (index < 0) refuse('', '', 'missing resolved integrity plugin');
        const later = config.plugins.slice(index + 1).find((next) => {
          const hook = next.transformIndexHtml;
          return hook && !Is.func(hook) && hook.order === 'pre';
        });
        if (later) refuse('', '', `pre HTML hook ${later.name} must run before sys:html-integrity`);
        // Load the public classifier only for an opted-in build, not when importing /plugins.
        ({ isCSSRequest } = await import('vite'));
      },
      transformIndexHtml: {
        order: 'pre',
        handler(html, context) {
          const file = Path.relativePosix(Path.relative(config.root, context.filename));
          // Vite expands HTML env tokens after all user pre hooks. Refuse expansion rather
          // than validate different input or duplicate its value-expansion implementation.
          for (const [token, key] of html.matchAll(/%(\S+?)%/g)) {
            if (
              Object.hasOwn(config.env, key) ||
              Object.hasOwn(config.define ?? {}, `import.meta.env.${key}`)
            ) {
              refuse(
                file,
                token,
                'HTML environment substitution is unsupported with integrity enabled',
              );
            }
          }
          validateIntegrityInputs(html, file, config.base, isCSSRequest);
        },
      },
      generateBundle: {
        // Vite import analysis rewrites JS after transformIndexHtml and ordinary bundle hooks.
        order: 'post',
        handler(options, bundle) {
          if (options.format !== 'es' || this.environment.config.consumer !== 'client') {
            throw new Error(
              '[sys:html-integrity] only client HTML builds with ESM output are supported',
            );
          }
          const html = Object.values(bundle).filter((output) =>
            output.type === 'asset' && output.fileName.endsWith('.html')
          );
          if (html.length === 0) {
            throw new Error('[sys:html-integrity] requires an emitted HTML entry');
          }
          for (const output of html) {
            if (output.type !== 'asset') continue;
            const text = Is.str(output.source)
              ? output.source
              : new TextDecoder('utf-8', { fatal: true }).decode(output.source);
            output.source = finalizeIntegrityHtml(text, output.fileName, config.base, bundle);
          }
        },
      },
    };
    return plugin;
  },
};
