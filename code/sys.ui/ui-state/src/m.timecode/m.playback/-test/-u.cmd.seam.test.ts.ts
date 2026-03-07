import { type t, Cmd, describe, expect, it } from '../../../-test.ts';

import { Playback } from '../mod.ts';
import { emptyState, timeline } from './u.fixture.ts';

type M = t.PlaybackCmd;

describe('Cmd seam — Playback over MessagePort', () => {
  it('hello world: send input, get back next state', async () => {
    type Name = 'playback:input';
    type Payload = { 'playback:input': { input: t.PlaybackInput } };
    type Result = { 'playback:input': { state: t.PlaybackState; cmds: readonly t.PlaybackCmd[] } };

    const cmd = Cmd.make<Name, Payload, Result>();
    const { port1, port2 } = new MessageChannel();

    let curr: t.PlaybackState = emptyState();

    const host = cmd.host(port1, {
      'playback:input': ({ input }: Payload['playback:input']) => {
        const u = Playback.reduce(curr, input);
        curr = u.state;
        return { state: u.state, cmds: u.cmds };
      },
    });

    const client = cmd.client(port2);

    await client.send('playback:input', {
      input: {
        kind: 'playback:init',
        timeline: timeline(),
      },
    });
    const res = await client.send('playback:input', { input: { kind: 'playback:play' } });

    expect(res.state.intent).to.eql('play');
    expect(res.cmds.length > 0).to.eql(true);

    client.dispose();
    host.dispose();
  });
});
