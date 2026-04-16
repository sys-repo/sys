import { type t } from './common.ts';

export const DEFAULT_LAYOUT = {
  manifestsDir: 'manifests',
  contentDir: 'content',
} as const satisfies t.SlugDataClient.Layout;

export function toLayout(layout?: t.SlugDataClient.Layout): t.SlugDataClient.Layout {
  return { ...DEFAULT_LAYOUT, ...(layout ?? {}) } as const;
}
