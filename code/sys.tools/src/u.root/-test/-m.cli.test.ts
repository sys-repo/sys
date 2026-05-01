import { describe, expect, it } from '../../-test.ts';
import { cli } from '../m.cli.ts';

describe('Root CLI', () => {
  it('shows cached advisory and refreshes it before dispatching a root subcommand', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, ['pi', '--flag'], {
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        return {
          path: '/tmp/advisory.json' as never,
          record: undefined,
          stale: true,
          hasUpdate: true,
          prelude: 'Run sys update --latest',
        };
      },
      refreshRootUpdateAdvisoryInBackground() {
        events.push('refresh');
      },
      async dispatchRootCommand(cwd, command, argv, context) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}:${context.origin}`);
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
      'dispatch:/tmp/sys.tools.root:pi:pi --flag:argv',
    ]);
  });

  it('dispatches root-menu selections with root-menu origin', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, [], {
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        return {
          path: undefined,
          record: undefined,
          stale: false,
          hasUpdate: true,
          prelude: undefined,
        };
      },
      refreshRootUpdateAdvisoryInBackground() {
        events.push('refresh');
      },
      async rootMenu(args) {
        events.push(`menu:${args.highlightUpdate}`);
        return { kind: 'selected', command: 'update' };
      },
      async dispatchRootCommand(cwd, command, argv, context) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}:${context.origin}`);
      },
    });

    expect(events).to.eql([
      'prepare',
      'refresh',
      'menu:true',
      'dispatch:/tmp/sys.tools.root:update:update:root-menu',
    ]);
  });

  it('reopens the root menu when a selected tool returns back', async () => {
    const events: string[] = [];
    let menuCount = 0;

    await cli('/tmp/sys.tools.root' as never, [], {
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        return {
          path: undefined,
          record: undefined,
          stale: false,
          hasUpdate: false,
          prelude: undefined,
        };
      },
      refreshRootUpdateAdvisoryInBackground() {
        events.push('refresh');
      },
      async rootMenu(args) {
        menuCount += 1;
        events.push(`menu:${menuCount}:${args.highlightUpdate}`);
        return menuCount === 1 ? { kind: 'selected', command: 'update' } : { kind: 'exit' };
      },
      async dispatchRootCommand(cwd, command, argv, context) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}:${context.origin}`);
        return { kind: 'back' };
      },
    });

    expect(events).to.eql([
      'prepare',
      'refresh',
      'menu:1:false',
      'dispatch:/tmp/sys.tools.root:update:update:root-menu',
      'menu:2:false',
    ]);
  });

  it('continues root subcommand dispatch when advisory preparation fails', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, ['pi'], {
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        throw new Error('cache unavailable');
      },
      refreshRootUpdateAdvisoryInBackground() {
        events.push('refresh');
      },
      async dispatchRootCommand(cwd, command, argv, context) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}:${context.origin}`);
      },
    });

    expect(events).to.eql([
      'prepare',
      'dispatch:/tmp/sys.tools.root:pi:pi:argv',
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

  it('prepares advisory state before root subcommand help invocation', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, ['pi', '--help'], {
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        return {
          path: '/tmp/advisory.json' as never,
          record: undefined,
          stale: true,
          hasUpdate: true,
          prelude: 'Run sys update --latest',
        };
      },
      refreshRootUpdateAdvisoryInBackground() {
        events.push('refresh');
      },
      async dispatchRootCommand(cwd, command, argv, context) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}:${context.origin}`);
      },
      info(...data) {
        events.push(`info:${data.map(String).join(' ')}`);
      },
      async rootMenu() {
        throw new Error('root menu should not run for subcommand help invocation');
      },
    });

    expect(events).to.eql([
      'prepare',
      'refresh',
      'info:Run sys update --latest',
      'dispatch:/tmp/sys.tools.root:pi:pi --help:argv',
    ]);
  });
});
