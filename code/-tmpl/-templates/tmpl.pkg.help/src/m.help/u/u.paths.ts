import type { t } from '../common.ts';

export const HelpResource = {
  Root: 'yaml/root.yaml',
  Source: {
    get Files(): readonly t.StringPath[] {
      return [HelpResource.Root];
    },
  },
} as const;
