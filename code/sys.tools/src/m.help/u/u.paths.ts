import type { t } from '../common.ts';

export const HelpResource = {
  Root: 'yaml/root.yaml',
  Dsl: {
    Root: {
      id: 'dsl',
      file: 'yaml/dsl.yaml',
      children: [
        {
          id: 'serve',
          file: 'yaml/dsl.serve.yaml',
          children: [],
        },
        {
          id: 'deploy',
          file: 'yaml/dsl.deploy.yaml',
          children: [],
        },
      ],
    },
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [
        HelpResource.Root,
        HelpResource.Dsl.Root.file,
        ...HelpResource.Dsl.Root.children.map((child) => child.file),
      ];
    },
  },
} as const;
