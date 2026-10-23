import { describe, expect, it } from '../../-test.ts';
import { resolveCommand } from '../u/u.worker.ts';

describe('WorkspaceRun: command selection', () => {
  it('private packages do not acquire an implicit publish dry-run', () => {
    expect(resolveCommand({ private: true }, 'dry')).to.eql(null);
    expect(resolveCommand({ private: true, tasks: { dry: ' ' } }, 'dry')).to.eql(null);
  });

  it('explicit private-package tasks retain their authority', () => {
    for (const task of ['dry', 'check', 'test'] as const) {
      const deno = { private: true, tasks: { [task]: 'deno check src/mod.ts' } };
      expect(resolveCommand(deno, task)).to.eql({ cmd: 'deno', args: ['task', task] });
    }
  });

  it('public packages retain publish fallback; missing ordinary tasks stay skipped', () => {
    for (const deno of [{}, { private: false }]) {
      expect(resolveCommand(deno, 'dry')).to.eql({
        cmd: 'deno',
        args: ['publish', '--allow-dirty', '--dry-run'],
      });
      expect(resolveCommand(deno, 'test')).to.eql(null);
      expect(resolveCommand(deno, 'check')).to.eql(null);
    }
  });
});
