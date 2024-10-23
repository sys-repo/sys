import type { t } from '../common.ts';

/**
 * Default configuration for the Emotion (CSS-in-JS) library
 * to be passed to the [@vitejs/plugin-react-swc] plugin.
 *
 * https://emotion.sh/docs
 */
export function pluginOptions(): t.ReactPluginOptions {
  return {
    jsxImportSource: '@emotion/react',
    plugins: [
      [
        '@swc/plugin-emotion',
        {
          sourceMap: true,
          autoLabel: 'dev-only',
          labelFormat: '[local]',
        },
      ],
    ],
  };
}
