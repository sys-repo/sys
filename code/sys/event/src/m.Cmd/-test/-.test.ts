import { describe, expect, it } from '../../-test.ts';
import { Cmd } from '../mod.ts';
import { CmdIs } from '../m.Is.ts';

describe(`Cmd: Command But`, () => {
  it('API', async () => {
    const m = await import('@sys/event/cmd');
    expect(m.Cmd).to.equal(Cmd);
    expect(m.Cmd.Is).to.equal(CmdIs);
  });

  describe('Hello World', () => {
    //     });
  });
});
