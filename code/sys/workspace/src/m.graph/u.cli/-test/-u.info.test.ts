import { describe, expect, it } from '../../../-test.ts';
import { info } from '../u.info.ts';

describe('Workspace.Graph.Cli.info', () => {
  it('builds an explicit deno info json command from cwd and root', () => {
    const command = info({
      cwd: '/workspace/root',
      root: 'code/sys/workspace/src/mod.ts',
    });

    expect(command).to.eql({
      cmd: 'deno',
      cwd: '/workspace/root',
      args: ['info', '--json', 'code/sys/workspace/src/mod.ts'],
    });
  });

  it('preserves the explicit root path exactly as provided', () => {
    const command = info({
      cwd: '/workspace/root',
      root: 'deploy/app/src/mod.ts',
    });

    expect(command.args.slice(2)).to.eql(['deploy/app/src/mod.ts']);
  });
});
