import { describe, expect, it } from '../../-test.ts';
import { Net } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('Net.waitFor', () => {
  it('resolves immediately when WebSocket is already open', async () => {
    const ws = Fixture.makeFakeWebSocket('ws://example');
    ws.readyState = 1; // OPEN

    await Net.waitFor(ws as WebSocket);
  });

  it('resolves when WebSocket transitions to open', async () => {
    const ws = Fixture.makeFakeWebSocket('ws://example');

    const waiting = Net.waitFor(ws as WebSocket);

    ws.readyState = 1; // OPEN
    ws.dispatchEvent(new Event('open'));

    await waiting;
  });

  it('rejects when WebSocket emits an error', async () => {
    const ws = Fixture.makeFakeWebSocket('ws://example');

    const waiting = Net.waitFor(ws as WebSocket);
    ws.dispatchEvent(new Event('error'));

    let caught: unknown;
    try {
      await waiting;
    } catch (err) {
      caught = err;
    }

    expect(caught).to.not.eql(undefined);
  });
});
