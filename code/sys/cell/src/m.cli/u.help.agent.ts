import { CliFmt, Str } from './common.ts';
import { Tmpl } from './u.tmpl.ts';

export const FmtAgentHelp = {
  async output(toolname = '@sys/cell/cli help agent'): Promise<string> {
    const descriptor = await Tmpl.minimalDescriptor();
    const gitignore = Tmpl.gitignore();

    return CliFmt.Help.build({
      tool: toolname,
      summary: intro(),
      sections: [
        {
          kind: 'lines',
          label: 'Init',
          items: [
            'Run init when the folder is missing the Cell descriptor.',
            'Init is additive and writes the embedded default resources.',
          ],
        },
        { kind: 'lines', label: 'Writes', items: Tmpl.minimalWritePaths() },
        { kind: 'lines', label: 'Owns', items: Tmpl.minimalOwnedPaths() },
        {
          kind: 'lines',
          label: 'Safety',
          items: [
            `${gitignore.path} may add ${gitignore.entries.join(', ')} once; never rewrite user rules.`,
          ],
        },
        {
          kind: 'lines',
          label: 'Preserve',
          items: ['.pi/', '-config/@sys.pi/', 'other tool-owned -config/* namespaces'],
        },
        {
          kind: 'lines',
          label: 'Rule',
          items: [
            'Cell owns topology; service config owns service details.',
            'Pull config owns materialization. Do not turn cell.yaml',
            'into a mega-config.',
          ],
        },
        {
          kind: 'lines',
          label: 'Descriptor',
          items: ['YAML', '```yaml', ...block(descriptor), '```'],
        },
      ],
    });
  },
} as const;

/**
 * Helpers:
 */

function intro() {
  return Str.dedent(`
    Expanded guidance for coding agents editing a Cell folder.
    Keep changes additive, owner-correct, and in plain files.
  `);
}

function block(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text).split('\n');
}
