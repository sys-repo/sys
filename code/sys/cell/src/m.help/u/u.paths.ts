import type { t } from '../common.ts';

const path = (value: string) => value as t.StringPath;

export const HelpResource = {
  Root: path('yaml/root.yaml'),
  Init: path('yaml/init.yaml'),
  Dsl: {
    Index: path('yaml/dsl.yaml'),
    Acts: [path('yaml/dsl.pulled-view.yaml')],
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [
        HelpResource.Root,
        HelpResource.Init,
        HelpResource.Dsl.Index,
        ...HelpResource.Dsl.Acts,
      ];
    },
  },
} as const;
