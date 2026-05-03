import { c, CliFmt, CliTable, Str } from './common.ts';
import { Tmpl } from './u.tmpl.ts';

type HelpSection = {
  readonly label: string;
  readonly items: readonly string[];
};

export const FmtAgentHelp = {
  async output(toolname = '@sys/cell/cli help agent'): Promise<string> {
    const descriptor = await Tmpl.minimalDescriptor();
    const gitignore = Tmpl.gitignore();

    const help = CliFmt.Help.build({ tool: toolname, summary: intro() });
    return `${help}\n\n${guideTable([
      {
        label: 'Init',
        items: [
          'Run init when the folder is missing the Cell descriptor.',
          'Init is additive and writes the embedded default resources.',
        ],
      },
      { label: 'Writes', items: Tmpl.minimalWritePaths() },
      { label: 'Owns', items: Tmpl.minimalOwnedPaths() },
      {
        label: 'Safety',
        items: [
          `${gitignore.path} may add ${gitignore.entries.join(', ')} once; never rewrite user rules.`,
        ],
      },
      {
        label: 'Preserve',
        items: ['.pi/', '-config/@sys.pi/', 'other tool-owned -config/* namespaces'],
      },
      {
        label: 'Rule',
        items: [
          'Cell owns topology; service config owns service details.',
          'Pull config owns materialization. Do not turn cell.yaml',
          'into a mega-config.',
        ],
      },
      {
        label: 'Speech acts',
        items: [
          'initialize this folder as a Cell',
          'add a local view named <name> at <path>',
          'add a pulled view named <name> from <dist-url> into <path>',
          'add a static view service named <name>',
          'add a runtime service named <name> using <module/export>',
          'add a proxy service named <name>',
          'mount <route> to <view/service/upstream>',
          'verify/load this Cell',
          'start the Cell runtime',
        ],
      },
      {
        label: 'Owner flows',
        items: [
          'Cell config references owned configs.',
          'Use each owning tool/API to create or validate its own config.',
          'Do not hand-write tool-owned YAML when an owner CLI/API exists.',
          'If no owner affordance exists, stop and ask before hand-authoring.',
        ],
      },
      {
        label: 'Act mapping',
        items: [
          'add local view → create files under view/, then register views.<name>.source.local',
          'add pulled view → use @sys/tools/pull, then register views.<name>.source.pull',
          'add service → use service owner flow, then register runtime.services[]',
          'add proxy → use proxy owner flow, then register runtime service and mounts',
          'mount route → update proxy owner config; cell.yaml only names the proxy service',
          'verify/load → run Cell.load against the folder',
          'start runtime → load Cell, start Cell.Runtime, wait/close lifecycle',
        ],
      },
      { label: 'Descriptor', items: ['YAML', '```yaml', ...block(descriptor), '```'] },
    ])}`;
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

function guideTable(sections: readonly HelpSection[]): string {
  const table = CliTable.create([]);

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) table.push(['', '']);
    section.items.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray(section.label) : '', c.white(item)]);
    });
  });

  return Str.trimEdgeNewlines(String(table));
}
