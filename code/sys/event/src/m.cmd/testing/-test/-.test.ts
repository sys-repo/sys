import { describe, expect, it } from '../../../-test.ts';
import { CmdFixture } from '../mod.ts';

describe('CmdFixture', () => {
  it('API', async () => {
    const m = await import('@sys/event/cmd/testing');
    expect(m.CmdFixture).to.equal(CmdFixture);
    expect(m.CmdFixture.localTransport).to.equal(CmdFixture.localTransport);
  });
});
