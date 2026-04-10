import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, type t } from '../common.ts';
import { menu } from '../u.menu.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.menu`, () => {
  it('menu → creates default profile config when none exist', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const original = Cli.Input.Select.prompt;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: () => Promise.resolve('exit'),
    });

    try {
      const res = await menu({ cwd });
      const path = Fs.join(cwd, '-config/@sys.driver-agent.pi/default.yaml');
      const text = await Deno.readTextFile(path);

      expect(res).to.eql({ kind: 'exit' });
      expect(text).to.contain('# pi profile: default');
      expect(text).to.contain('# Args passed through to Pi.');
      expect(text).to.contain('# Paths resolve relative to the current working directory.');
      expect(text).to.contain('args: []');
      expect(text).to.contain('read: []');
      expect(text).to.contain('env: {}');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
