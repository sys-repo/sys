import type { t } from './common.ts';

/**
 * Markdown help rendering with dev-friendly component defaults.
 */
export declare namespace DevHelpMarkdown {
  export type Lib = { readonly UI: t.FC<Props> };

  /** Props accepted by the Markdown help renderer. */
  export type Props = t.ProseMarkdown.Props;
}
