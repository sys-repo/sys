import type { t } from '../common.ts';

export function flavor(options?: { readonly flavor?: t.Markdown.Flavor }): t.Markdown.Flavor {
  return options?.flavor ?? 'gfm';
}
