import { describe, expect, it } from '../../-test.ts';
import { CmdIs } from '../m.Is.ts';
import { Cmd } from '../mod.ts';
import { fromWebSocket } from '../transport/mod.ts';

describe(`Cmd: Command (Bus)`, () => {
  it('API', async () => {
    const m = await import('@sys/event/cmd');
    expect(m.Cmd).to.equal(Cmd);
    expect(m.Cmd.Is).to.equal(CmdIs);
    expect(m.Cmd.Transport.fromWebSocket).to.equal(fromWebSocket);
  });
});
