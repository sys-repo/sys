import type { t } from '../common.ts';

export const HelpResource = {
  Root: 'yaml/root.yaml',
  Dsl: {
    Root: {
      id: 'dsl',
      file: 'yaml/dsl.yaml',
      children: [],
    },
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [HelpResource.Root, HelpResource.Dsl.Root.file];
    },
  },
} as const;
