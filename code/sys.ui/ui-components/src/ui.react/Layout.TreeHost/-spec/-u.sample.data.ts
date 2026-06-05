import type { t } from './common.ts';
import { IndexTreeView } from '../../TreeView.Index/mod.ts';
import { SAMPLE_YAML } from '../../TreeView.Index/-spec/mod.ts';

export const SAMPLE_TREE_1: t.TreeHostViewNodeList = [
  {
    path: ['docs'],
    key: '/docs',
    label: 'Docs',
    children: [
      {
        path: ['docs', 'getting-started'],
        key: '/docs/getting-started',
        label: 'Getting Started',
        value: { ref: 'docs/getting-started' },
      },
      {
        path: ['docs', 'guides'],
        key: '/docs/guides',
        label: 'Guides',
        children: [
          {
            path: ['docs', 'guides', 'modularity'],
            key: '/docs/guides/modularity',
            label: 'Modularity',
            value: { ref: 'docs/guides/modularity' },
          },
          {
            path: ['docs', 'guides', 'cohesion'],
            key: '/docs/guides/cohesion',
            label: 'Cohesion',
            value: { ref: 'docs/guides/cohesion' },
          },
          {
            path: ['docs', 'guides', 'separation-of-concerns'],
            key: '/docs/guides/separation-of-concerns',
            label: 'Separation of Concerns',
            value: { ref: 'docs/guides/separation-of-concerns' },
          },
          {
            path: ['docs', 'guides', 'abstraction'],
            key: '/docs/guides/abstraction',
            label: 'Abstraction',
            value: { ref: 'docs/guides/abstraction' },
          },
          {
            path: ['docs', 'guides', 'loose-coupling'],
            key: '/docs/guides/loose-coupling',
            label: 'Loose Coupling',
            value: { ref: 'docs/guides/loose-coupling' },
          },
        ],
      },
    ],
  },
  {
    path: ['examples'],
    key: '/examples',
    label: 'Examples',
    children: [
      {
        path: ['examples', 'alpha'],
        key: '/examples/alpha',
        label: 'Alpha',
        value: { ref: 'examples/alpha' },
      },
      {
        path: ['examples', 'beta'],
        key: '/examples/beta',
        label: 'Beta',
        value: { ref: 'examples/beta' },
      },
    ],
  },
];

export const SAMPLE_TREE_2: t.TreeHostViewNodeList = toTreeHostNodes(
  IndexTreeView.Data.Yaml.parse(SAMPLE_YAML),
);

function toTreeHostNodes(nodes: t.TreeViewNodeList): t.TreeHostViewNodeList {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? toTreeHostNodes(node.children) : undefined,
  }));
}
