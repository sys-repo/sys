import { describe, expect, it } from '../../../-test.ts';
import { c, Cli, Fmt } from '../../mod.ts';
import type { t } from '../../common.ts';

describe('Cli.Fmt.Help', () => {
  it('types: sections and shorthand forms are mutually exclusive', () => {
    const shorthand: t.CliFormatHelpInput = {
      tool: '@sys/workspace/cli',
      usage: ['@sys/workspace/cli [options]'],
    };
    const sections: t.CliFormatHelpInput = {
      tool: '@sys/workspace/cli',
      sections: [{ kind: 'lines', label: 'Usage', items: ['@sys/workspace/cli [options]'] }],
    };

    expect(shorthand.tool).to.eql('@sys/workspace/cli');
    expect(sections.tool).to.eql('@sys/workspace/cli');

    // @ts-expect-error mixed input modes are intentionally rejected
    const mixed: t.CliFormatHelpInput = {
      tool: '@sys/workspace/cli',
      sections: [{ kind: 'lines', label: 'Usage', items: ['@sys/workspace/cli [options]'] }],
      usage: ['@sys/workspace/cli [options]'],
    };

    expect(mixed).to.not.eql(undefined);
  });

  it('builds a shared help page from declarative shorthand input', () => {
    const help = Fmt.Help.build({
      tool: '@sys/workspace/cli',
      summary: 'Upgrade workspace dependencies from canonical deps.yaml.',
      note: 'Interactive by default; non-interactive for reporting or scripted apply.',
      usage: ['@sys/workspace/cli [options]'],
      options: [
        ['-h, --help', 'show help'],
        ['--apply', 'write deps.yaml and projected files'],
      ],
      examples: ['@sys/workspace/cli', '@sys/workspace/cli --non-interactive'],
    });

    const plain = Cli.stripAnsi(help);
    expect(help).to.include(c.bold(c.brightCyan('@sys/workspace/cli')));
    expect(help).to.include(c.white('Upgrade workspace dependencies from canonical deps.yaml.'));
    expect(help).to.include(
      c.gray('Interactive by default; non-interactive for reporting or scripted apply.'),
    );
    expect(plain).to.include('Usage');
    expect(plain).to.include('Options');
    expect(plain).to.include('Examples');
    expect(plain).to.include('--apply');
  });

  it('supports generalized sections for future help layouts', () => {
    const help = Fmt.Help.build({
      tool: '@sys/tool',
      sections: [
        {
          kind: 'lines',
          label: 'Commands',
          items: ['tool sync', 'tool check'],
        },
        {
          kind: 'pairs',
          label: 'Environment',
          items: [['SYS_TOKEN', 'auth token for remote operations']],
        },
      ],
    });

    const plain = Cli.stripAnsi(help);
    expect(plain).to.include('Commands');
    expect(plain).to.include('tool sync');
    expect(plain).to.include('Environment');
    expect(plain).to.include('SYS_TOKEN');
    expect(plain).to.include('auth token for remote operations');
  });

  it('render prints the built help page', () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      Fmt.Help.render({
        tool: 'sys tool',
        usage: ['sys tool [options]'],
      });
    } finally {
      console.info = info;
    }

    expect(calls).to.eql([Fmt.Help.build({ tool: 'sys tool', usage: ['sys tool [options]'] })]);
  });
});
