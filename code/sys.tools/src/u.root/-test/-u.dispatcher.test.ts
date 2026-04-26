import { describe, expect, it } from '../../-test.ts';
import { Imports } from '../u.imports.ts';
import { D } from '../common.ts';
import { dispatchRootCommand } from '../u.dispatcher.ts';

describe('Root Dispatcher', () => {
  it('each tool import exports cli(cwd, argv)', async () => {
    for (const cmd of D.TOOLS) {
      const mod = await Imports[cmd]();

      const hasCli = typeof (mod as { readonly cli?: unknown }).cli === 'function';
      expect(hasCli, `tool "${cmd}" must export cli(cwd, argv) from its mod.ts`).eql(true);
    }
  });

  it('dispatchRootCommand → preserves the caller cwd when delegating', async () => {
    const cwd = '/tmp/sys.tools.dispatch.cwd' as never;
    const original = Imports.pi;
    const calls: Array<{ cwd: string; argv: readonly string[] }> = [];

    try {
      Object.defineProperty(Imports, 'pi', {
        value: async () => ({
          cli(inputCwd: string, argv: readonly string[]) {
            calls.push({ cwd: inputCwd, argv });
            return Promise.resolve();
          },
        }),
      });

      await dispatchRootCommand(cwd, 'pi', ['pi', '--git-root=cwd']);
      expect(calls).to.eql([{ cwd, argv: ['--git-root=cwd'] }]);
    } finally {
      Object.defineProperty(Imports, 'pi', { value: original });
    }
  });
});
