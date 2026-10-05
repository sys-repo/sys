import { describe, expect, expectError, it } from '../../-test.ts';
import { cli } from '../m.cli.ts';
import { parseArgs } from '../u.args.ts';

describe('@sys/tools/pull u.args', () => {
  it('defaults to interactive mode', () => {
    const res = parseArgs([]);
    expect(res.interactive).to.eql(true);
  });

  it('parses --non-interactive and --config', () => {
    const res = parseArgs([
      '--non-interactive',
      '--config',
      './-config/@sys.tools.pull/sample.yaml',
    ]);
    expect(res['non-interactive']).to.eql(true);
    expect(res.interactive).to.eql(false);
    expect(res.config).to.eql('./-config/@sys.tools.pull/sample.yaml');
  });

  it('old or mixed --integrity flag → refuse instead of silently ignoring authority', () => {
    for (
      const prefix of [[], ['--scheme', 'sys.dist/v2', '--digest', `sha256-${'a'.repeat(64)}`]]
    ) {
      expect(() => parseArgs([...prefix, '--integrity', `sha256-${'b'.repeat(64)}`]))
        .to.throw('--integrity is unsupported');
    }
  });

  it('add-only flags outside add → refuse instead of discarding operator constraints', () => {
    const flags = [
      ['--scheme', 'sys.dist/v2', '--digest', `sha256-${'b'.repeat(64)}`],
      ['--scheme', 'unsupported'],
      ['--digest', 'malformed'],
      ['--scheme'],
      ['--manifest', 'https://example.test/dist.json'],
      ['--store', './store'],
      ['--project', './view'],
      ['--mode', 'replace'],
      ['--dry-run'],
      ['--dry-run=false'],
    ];
    for (const prefix of [[], ['--non-interactive']]) {
      for (const input of flags) {
        expect(() => parseArgs([...prefix, ...input])).to.throw('requires the add command');
      }
    }
    expect(parseArgs(['add', '--help']).help).to.eql(true);
    expect(parseArgs(['--help']).help).to.eql(true);
  });

  it('CLI pin flags → refuse before acquiring the selected configuration', async () => {
    for (const prefix of [[], ['--non-interactive']]) {
      for (const scheme of ['sys.dist/v2', 'unsupported']) {
        await expectError(
          () =>
            cli('/unused', [
              ...prefix,
              '--config',
              '/unused/not-acquired.yaml',
              '--scheme',
              scheme,
              '--digest',
              `sha256-${'b'.repeat(64)}`,
            ]),
          '--scheme requires the add command',
        );
      }
    }
  });

  it('parses the add command and config mutation flags', () => {
    const res = parseArgs([
      'add',
      '--dry-run',
      '--config',
      './-config/@sys.tools.pull/components.yaml',
      '--manifest',
      'https://example.com/ui.components/dist.json',
      '--scheme',
      'sys.dist/v2',
      '--digest',
      `sha256-${'a'.repeat(64)}`,
      '--store',
      './.dist-store',
      '--project',
      './view/components',
      '--mode',
      'replace',
    ]);

    expect(res.command).to.eql('add');
    expect(res.interactive).to.eql(true);
    expect(res['dry-run']).to.eql(true);
    expect(res.config).to.eql('./-config/@sys.tools.pull/components.yaml');
    expect(res.manifest).to.eql('https://example.com/ui.components/dist.json');
    expect(res.scheme).to.eql('sys.dist/v2');
    expect(res.digest).to.eql(`sha256-${'a'.repeat(64)}`);
    expect(res.store).to.eql('./.dist-store');
    expect(res.project).to.eql('./view/components');
    expect(res.mode).to.eql('replace');
  });
});
