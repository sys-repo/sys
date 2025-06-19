import { Repo } from '@automerge/automerge-repo';

import { describe, expect, it, Obj } from '../../-test.ts';
import { Crdt } from '../../m.Crdt.-fs/mod.ts';
import { CrdtIs, CrdtUrl } from '../mod.ts';
import { toRepo } from '../u.repo.ts';

describe('Crdt', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };
  const repo = toRepo(new Repo());
  const Is = CrdtIs;

  describe('Is', () => {
    it('Is.ref', () => {
      const doc = repo.create<T>({ count: 0 });
      expect(Is.ref(doc)).to.be.true;

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => expect(CrdtIs.ref(value)).to.be.false);
    });

    it('Is.id', () => {
      const doc = repo.create<T>({ count: 0 });
      expect(Is.id(doc.id)).to.be.true;
      expect(Is.id(String(doc.id))).to.be.true;

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => expect(CrdtIs.ref(value)).to.be.false);
    });
  });

  describe('Url', () => {
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

  describe('Change:', () => {
    it('assign deep text value', async () => {
      type T = { foo?: { bar?: { text?: string } } };
      const repo = Crdt.repo();
      const doc = repo.create<T>({});

      expect(doc.current.foo?.bar?.text).to.eql(undefined);
      doc.change((d) => Obj.Path.mutate(d, ['foo', 'bar', 'text'], 'hello'));
      expect(doc.current.foo?.bar?.text).to.eql('hello');
    });
  });
});
