import { describe, expect, it } from '../../-test.ts';
import { cli } from '../m.cli.ts';

describe('Root CLI', () => {
  it('shows checked advisory before dispatching a root subcommand', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, ['pi', '--flag'], {
      async prepareRootUpdateAdvisory() {
        events.push('prepare');
        return {
          path: '/tmp/advisory.json' as never,
          record: undefined,
          hasUpdate: true,
          prelude: 'Run sys update --latest',
        };
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
          hasUpdate: true,
          prelude: undefined,
        };
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
          hasUpdate: false,
          prelude: undefined,
        };
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
      async dispatchRootCommand(cwd, command, argv, context) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}:${context.origin}`);
      },
    });

    expect(events).to.eql([
      'prepare',
      'dispatch:/tmp/sys.tools.root:pi:pi:argv',
    ]);
  });

  it('passes --no-update-check only to the advisory seam and not the selected tool', async () => {
    const events: string[] = [];

    await cli('/tmp/sys.tools.root' as never, ['--no-update-check', 'pi', '--flag'], {
      async prepareRootUpdateAdvisory(options) {
        events.push(`prepare:${options?.noUpdateCheck}`);
        return {
          path: undefined,
          record: undefined,
          hasUpdate: false,
          prelude: undefined,
        };
      },
      async dispatchRootCommand(cwd, command, argv, context) {
        events.push(`dispatch:${cwd}:${command}:${argv.join(' ')}:${context.origin}`);
      },
      info(...data) {
        events.push(`info:${data.map(String).join(' ')}`);
      },
    });

    expect(events).to.eql([
      'prepare:true',
      'dispatch:/tmp/sys.tools.root:pi:pi --flag:argv',
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
          hasUpdate: true,
          prelude: 'Run sys update --latest',
        };
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
      'info:Run sys update --latest',
      'dispatch:/tmp/sys.tools.root:pi:pi --help:argv',
    ]);
  });
});
