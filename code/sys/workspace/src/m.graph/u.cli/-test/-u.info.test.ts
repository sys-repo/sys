import { describe, expect, it } from '../../../-test.ts';
import { info } from '../u.info.ts';

describe('Workspace.Graph.Cli.info', () => {
  it('builds an explicit deno info json command from cwd and roots', () => {
    const command = info({
      cwd: '/workspace/root',
      roots: ['code/sys/workspace/src/mod.ts', 'code/sys/esm/src/mod.ts'],
    });

    expect(command).to.eql({
      cmd: 'deno',
      cwd: '/workspace/root',
      args: [
        'info',
        '--json',
        'code/sys/workspace/src/mod.ts',
        'code/sys/esm/src/mod.ts',
      ],
    });
  });

  it('preserves root ordering exactly as provided', () => {
    const command = info({
      cwd: '/workspace/root',
      roots: ['deploy/app/src/mod.ts', 'code/sys/std/src/mod.ts', 'code/sys/types/src/mod.ts'],
    });

    expect(command.args.slice(2)).to.eql([
      'deploy/app/src/mod.ts',
      'code/sys/std/src/mod.ts',
      'code/sys/types/src/mod.ts',
    ]);
  });
});
