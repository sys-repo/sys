import type { t } from '../common.ts';

export const HelpResource = {
  Root: path('yaml/root.yaml'),
  Source: {
    get Files(): readonly t.StringPath[] {
      return [HelpResource.Root];
    },
  },
} as const;

/**
 * Helpers:
 */
function path(value: string): t.StringPath {
  return value;
}
