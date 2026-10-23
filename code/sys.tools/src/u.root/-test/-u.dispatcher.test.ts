import { describe, expect, Is, it } from '../../-test.ts';
import { Imports } from '../u.imports.ts';
import { D } from '../common.ts';
import { dispatchRootCommand } from '../u.dispatcher.ts';

describe('Root Dispatcher', () => {
  it('each tool import exports cli(cwd, argv)', async () => {
    for (const cmd of D.TOOLS) {
      const mod = await Imports[cmd]();

      const hasCli = Is.func((mod as { readonly cli?: unknown }).cli);
      expect(hasCli, `tool "${cmd}" must export cli(cwd, argv) from its mod.ts`).eql(true);
    }
  });

  it('dispatchRootCommand → preserves cwd/argv/context and returns the child result', async () => {
    const cwd = '/tmp/sys.tools.dispatch.cwd' as never;
    const original = Imports.pi;
    const calls: Array<{ cwd: string; argv: readonly string[]; origin: string }> = [];

    try {
      Object.defineProperty(Imports, 'pi', {
        value: async () => ({
          cli(inputCwd: string, argv: readonly string[], context: { readonly origin: string }) {
            calls.push({ cwd: inputCwd, argv, origin: context.origin });
            return Promise.resolve({ kind: 'back' } as const);
          },
        }),
      });

      const result = await dispatchRootCommand(cwd, 'pi', ['pi', '--git-root=cwd'], {
        origin: 'root-menu',
      });
      expect(calls).to.eql([{ cwd, argv: ['--git-root=cwd'], origin: 'root-menu' }]);
      expect(result).to.eql({ kind: 'back' });
    } finally {
      Object.defineProperty(Imports, 'pi', { value: original });
    }
  });
});
