import { describe, expect, it } from '../../-test.ts';
import { CrdtUrl } from '../mod.ts';

describe('Crdt.Url', () => {
  it('Url.ws (websockets prefix)', () => {
    const test = (input: string | undefined, expected: string) => {
      const url = CrdtUrl.ws(input);
      expect(url).to.eql(expected);
    };

    test('', '');

    test('sync.db.team', 'wss://sync.db.team');
    test('  sync.db.team  ', 'wss://sync.db.team');
    test('wss://sync.automerge.org', 'wss://sync.automerge.org');
    test('ws://sync.automerge.org', 'wss://sync.automerge.org');

    test('localhost:3030', 'ws://localhost:3030');
    test('ws://localhost:3030', 'ws://localhost:3030');
    test('wss://localhost:3030', 'ws://localhost:3030');
  });
});
