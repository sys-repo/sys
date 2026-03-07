import { describe, expect, it, type t } from '../../-test.ts';
import { Process } from '../../m.process/mod.ts';
import { commandsFor, invokeDetachedWithOs } from '../u.invokeDetached.ts';

describe('Open.invokeDetached', () => {
  it('linux command chain includes WSL and Windows fallbacks', () => {
    const target = 'https://example.com' as t.StringUrl;
    const res = commandsFor(target, 'linux');
    expect(res).to.eql([
      { cmd: 'wslview', args: [target] },
      { cmd: 'xdg-open', args: [target] },
      {
        cmd: 'powershell.exe',
        args: ['-NoProfile', '-NonInteractive', '-Command', 'Start-Process', target],
      },
      { cmd: 'cmd.exe', args: ['/C', 'start', '', target] },
    ]);
  });

  it('falls through NotFound openers and succeeds on later candidate', () => {
    const target = 'https://example.com' as t.StringUrl;
    const processRef = Process as unknown as {
      invokeDetached: (config: t.ProcInvokeArgs) => { pid: number };
    };
    const original = processRef.invokeDetached;
    const attempts: string[] = [];

    try {
      processRef.invokeDetached = (config) => {
        attempts.push(config.cmd ?? '');
        if (config.cmd === 'wslview') throw new Deno.errors.NotFound('missing');
        if (config.cmd === 'xdg-open') throw new Deno.errors.NotFound('missing');
        return { pid: 42 };
      };

      invokeDetachedWithOs('/tmp', target, 'linux', { silent: true });
      expect(attempts).to.eql(['wslview', 'xdg-open', 'powershell.exe']);
    } finally {
      processRef.invokeDetached = original;
    }
  });

  it('throws NotFound when all linux candidates are unavailable', () => {
    const target = 'https://example.com' as t.StringUrl;
    const processRef = Process as unknown as {
      invokeDetached: (config: t.ProcInvokeArgs) => { pid: number };
    };
    const original = processRef.invokeDetached;

    try {
      processRef.invokeDetached = () => {
        throw new Deno.errors.NotFound('missing');
      };

      let error: unknown;
      try {
        invokeDetachedWithOs('/tmp', target, 'linux');
      } catch (err) {
        error = err;
      }
      expect(error instanceof Deno.errors.NotFound).to.eql(true);
    } finally {
      processRef.invokeDetached = original;
    }
  });
});
