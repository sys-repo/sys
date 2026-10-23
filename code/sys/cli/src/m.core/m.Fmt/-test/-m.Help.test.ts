import { describe, expect, it } from '../../../-test.ts';
import { c, Cli, Fmt } from '../../mod.ts';
import type { t } from '../../common.ts';

describe('Cli.Fmt.Help', () => {
  it('types: sections and shorthand forms are mutually exclusive', () => {
    const shorthand: t.CliFormatHelp.Input = {
      tool: '@sys/workspace/cli',
      usage: ['@sys/workspace/cli [options]'],
    };
    const sections: t.CliFormatHelp.Input = {
      tool: '@sys/workspace/cli',
      sections: [{ kind: 'lines', label: 'Usage', items: ['@sys/workspace/cli [options]'] }],
    };

    expect(shorthand.tool).to.eql('@sys/workspace/cli');
    expect(sections.tool).to.eql('@sys/workspace/cli');

    // @ts-expect-error mixed input modes are intentionally rejected
    const mixed: t.CliFormatHelp.Input = {
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
      note:
        'Interactive by default; non-interactive applies deterministically, and --dry-run previews without writing.',
      usage: ['@sys/workspace/cli [options]'],
      options: [
        ['-h, --help', 'show help'],
        ['--non-interactive', 'run without prompts'],
        ['--policy <none|patch|minor|latest>', 'set the upgrade policy'],
        ['--dry-run', 'render the upgrade result without writing files'],
      ],
      examples: [
        '@sys/workspace/cli',
        '@sys/workspace/cli --non-interactive',
        '@sys/workspace/cli --non-interactive --policy latest --dry-run',
      ],
    });

    const plain = Cli.stripAnsi(help);
    expect(help).to.include(`  ${c.bold(c.brightCyan('@sys/workspace/cli'))}`);
    expect(plain).to.match(/^\n  @sys\/workspace\/cli\n\nUpgrade workspace dependencies/m);
    expect(plain.endsWith('\n')).to.eql(true);
    expect(plain.endsWith('\n\n')).to.eql(false);
    expect(help).to.include(c.white('Upgrade workspace dependencies from canonical deps.yaml.'));
    expect(help).to.include(
      c.gray(
        'Interactive by default; non-interactive applies deterministically, and --dry-run previews without writing.',
      ),
    );
    expect(plain).to.include('Usage');
    expect(plain).to.include('Options');
    expect(plain).to.include('Examples');
    expect(plain).to.include('--policy');
    expect(plain).to.include('--dry-run');
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

  it('aligns section gutters across the help page', () => {
    const help = Fmt.Help.build({
      tool: '@sys/http/server/static config add',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: ['run static config add', 'run static config add --dry-run'],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['--config <name|path>', 'bare name maps to config path'],
            ['--dry-run', 'preview without writing'],
          ],
        },
        {
          kind: 'lines',
          label: 'Semantics',
          items: ['writes only durable config state'],
        },
        {
          kind: 'lines',
          label: 'Examples',
          tone: 'muted',
          items: ['run static config add --config view'],
        },
      ],
    });

    const lines = Cli.stripAnsi(help).split('\n');
    const find = (text: string) => {
      const line = lines.find((line) => line.includes(text));
      expect(line).to.not.eql(undefined);
      return line ?? '';
    };

    const usage = find('run static config add');
    const usageContinuation = find('run static config add --dry-run');
    const configOption = find('--config <name|path>');
    const dryRunOption = find('preview without writing');
    const semantics = find('writes only durable config state');
    const examples = find('run static config add --config view');

    const column = usage.indexOf('run static config add');
    expect(usageContinuation.indexOf('run static config add --dry-run')).to.eql(column);
    expect(configOption.indexOf('--config <name|path>')).to.eql(column);
    expect(dryRunOption.indexOf('--dry-run')).to.eql(column);
    expect(semantics.indexOf('writes only durable config state')).to.eql(column);
    expect(examples.indexOf('run static config add --config view')).to.eql(column);
  });

  it('keeps pair sections locally aligned', () => {
    const help = Fmt.Help.build({
      tool: '@sys/tool',
      sections: [
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['--long-option <value>', 'long option description'],
            ['--x', 'short option description'],
          ],
        },
      ],
    });

    const lines = Cli.stripAnsi(help).split('\n');
    const long = lines.find((line) => line.includes('long option description')) ?? '';
    const short = lines.find((line) => line.includes('short option description')) ?? '';

    expect(long.indexOf('long option description')).to.eql(
      short.indexOf('short option description'),
    );
  });

  it('fits summary and note prose within an explicit physical width', () => {
    const help = Fmt.Help.build({
      tool: '@sys/tool',
      summary:
        'Upgrade workspace dependencies from canonical deps.yaml while preserving local package ownership boundaries.',
      note:
        'Interactive by default; non-interactive applies deterministically, and --dry-run previews without writing.',
      layout: { width: 64 },
    });
    const plain = Cli.stripAnsi(help);

    expect(plain).to.contain('Upgrade workspace dependencies');
    expect(plain).to.contain('ownership boundaries.');
    expect(plain).to.contain('Interactive by default');
    expectMaxVisibleWidth(plain, 64);
  });

  it('fits line and pair section prose within an explicit physical width', () => {
    const help = Fmt.Help.build({
      tool: '@sys/tool',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            '@sys/tool run a very long command description that should wrap under the section body column',
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            [
              '--policy <none|patch|minor|latest>',
              'choose the dependency upgrade policy for every selected workspace package',
            ],
          ],
        },
      ],
      layout: { width: 72 },
    });
    const plain = Cli.stripAnsi(help);

    expect(plain).to.contain('@sys/tool run');
    expect(plain).to.contain('choose the dependency');
    expectMaxVisibleWidth(plain, 72);
  });

  it('uses stacked help rows when the physical width leaves too little body space', () => {
    const help = Fmt.Help.build({
      tool: '@sys/tool',
      sections: [
        {
          kind: 'pairs',
          label: 'Options',
          items: [['--dry-run', 'preview without writing files to disk']],
        },
      ],
      layout: { width: 32, minBodyWidth: 24 },
    });
    const plain = Cli.stripAnsi(help);

    expect(plain).to.contain('Options\n  --dry-run\n    preview without');
    expectMaxVisibleWidth(plain, 32);
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

function expectMaxVisibleWidth(text: string, width: number) {
  const wide = Cli.stripAnsi(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > width);
  expect(wide, wide.join('\n')).to.eql([]);
}
