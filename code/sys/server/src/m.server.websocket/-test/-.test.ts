import { describe, expect, it } from '../../-test.ts';
import { WebSocketServer } from '../mod.ts';

describe('WebSocketServer/API', () => {
  it('exports the public runtime surface', async () => {
    const m = await import('@sys/server/websocket');
    expect(m.WebSocketServer).to.equal(WebSocketServer);
    expect(Object.keys(WebSocketServer).sort()).to.eql(['create', 'start']);
    expect(Object.isFrozen(WebSocketServer)).to.eql(true);
  });
});
