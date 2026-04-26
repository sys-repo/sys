import { describe, expect, it } from '../../-test.ts';
import { cli } from '../m.cli.ts';

describe('Root CLI', () => {
  it('shows cached advisory and refreshes it before dispatching a root subcommand', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, ['pi', '--flag'], {
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        return {
          path: '/tmp/update-advisory.json' as never,
          record: undefined,
          stale: true,
          hasUpdate: true,
          prelude: 'Run sys update --latest',
        };
      },
      refreshRootUpdateAdvisoryInBackground() {
        events.push('refresh');
      },
      async dispatchRootCommand(cwd, command, argv) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}`);
      },
      info(...data) {
        events.push(`info:${data.map(String).join(' ')}`);
      },
      async rootMenu() {
        throw new Error('root menu should not run for direct subcommand dispatch');
      },
    });

    expect(events).to.eql([
      'prepare',
      'refresh',
      'info:Run sys update --latest',
      'dispatch:/tmp/sys.tools.root:pi:pi --flag',
    ]);
  });

  it('does not prepare advisory state for help-only root invocation', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, ['--help'], {
      printRootHelp() {
        events.push('help');
      },
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        throw new Error('should not prepare advisory for help-only root invocation');
      },
      async dispatchRootCommand() {
        events.push('dispatch');
      },
    });

    expect(events).to.eql(['help']);
  });

  it('does not prepare advisory state for root subcommand help invocation', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, ['pi', '--help'], {
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        throw new Error('should not prepare advisory for subcommand help invocation');
      },
      async dispatchRootCommand(cwd, command, argv) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}`);
      },
      info(...data) {
        events.push(`info:${data.map(String).join(' ')}`);
      },
      async rootMenu() {
        throw new Error('root menu should not run for subcommand help invocation');
      },
    });

    expect(events).to.eql([
      'dispatch:/tmp/sys.tools.root:pi:pi --help',
    ]);
  });
});
