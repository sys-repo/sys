import type { t } from '../common.ts';

export const wrangle = Object.freeze(
  {
    indent(text: string, indent: number) {
      return text
        .split('\n')
        .map((line) => `${' '.repeat(indent)}${line}`)
        .filter((line) => (!line.trim() ? line.trim() : line))
        .join('\n');
    },

    map(entries: Readonly<Record<string, string>>, indent: number) {
      return Object.entries(entries)
        .map(([key, value]) => `${' '.repeat(indent)}${key}: ${value}`)
        .join('\n');
    },

    list(values: readonly string[], indent: number) {
      return values.map((value) => `${' '.repeat(indent)}- ${value}`).join('\n');
    },

    on(value?: t.WorkspaceCi.WorkflowOn) {
      const on = value ?? { push: { branches: ['main'] as const } };
      const lines = ['on:'];
      if (on.push?.branches?.length || on.push?.tags?.length) {
        lines.push('  push:');
        if (on.push?.branches?.length) {
          lines.push('    branches:', wrangle.list(on.push.branches, 6));
        }
        if (on.push?.tags?.length) lines.push('    tags:', wrangle.list(on.push.tags, 6));
        if (on.push?.paths_ignore?.length) {
          lines.push('    paths-ignore:', wrangle.list(on.push.paths_ignore, 6));
        }
      }
      if (on.pull_request?.branches?.length) {
        lines.push('  pull_request:', '    branches:', wrangle.list(on.pull_request.branches, 6));
        if (on.pull_request?.paths_ignore?.length) {
          lines.push('    paths-ignore:', wrangle.list(on.pull_request.paths_ignore, 6));
        }
      }
      if (on.workflow_dispatch) lines.push('  workflow_dispatch:');
      return lines.join('\n');
    },
  } as const,
);
