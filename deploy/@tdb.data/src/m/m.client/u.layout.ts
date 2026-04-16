import { type t } from './common.ts';

export const DEFAULT_LAYOUT = {
  manifestsDir: 'manifests',
  contentDir: 'content',
} as const satisfies t.SlcDataClient.Layout;

export function toLayout(layout?: t.SlcDataClient.Layout): t.SlcDataClient.Layout {
  return { ...DEFAULT_LAYOUT, ...(layout ?? {}) } as const;
}
