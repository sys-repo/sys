import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { WIRE_VERSION } from '../common.ts';
import { Wire } from '../u.evt.wire.ts';

describe('Event helpers', () => {
  describe('Wire', () => {
    it('event(): repo "ready" payload', () => {
      const msg = Wire.event('crdt:repo', { type: 'ready', payload: { ready: true } });
      expect(msg.version).to.eql(WIRE_VERSION);
      expect(msg.type).to.eql('event');
      expect(msg.stream).to.eql('crdt:repo');
      expect(msg.event.type).to.eql('ready');
      if (msg.event.type === 'ready') expect(msg.event.payload.ready).to.eql(true);

      expectTypeOf(msg).toMatchTypeOf<t.WireEvent>();
    });

    it('event(): stream/open and stream/close with empty payload objects', () => {
      const open = Wire.event('crdt:repo', { type: 'stream/open', payload: {} });
      const close = Wire.event('crdt:repo', { type: 'stream/close', payload: {} });

      expect(open.version).to.eql(WIRE_VERSION);
      expect(open.type).to.eql('event');
      expect(open.event.type).to.eql('stream/open');
      expect(open.event.payload).to.eql({});

      expect(close.version).to.eql(WIRE_VERSION);
      expect(close.type).to.eql('event');
      expect(close.event.type).to.eql('stream/close');
      expect(close.event.payload).to.eql({});

      expectTypeOf(open).toMatchTypeOf<t.WireEvent>();
      expectTypeOf(close).toMatchTypeOf<t.WireEvent>();
    });

    it('call(): whenReady has no args', () => {
      const c = Wire.call(1, 'whenReady');
      expect(c.version).to.eql(WIRE_VERSION);
      expect(c.type).to.eql('call');
      expect(c.id).to.eql(1);
      expect(c.method).to.eql('whenReady');
      expect(Array.isArray(c.args)).to.eql(true);
      expect(c.args.length).to.eql(0);

      expectTypeOf(c).toMatchTypeOf<t.WireCall<'whenReady'>>();
    });

    it('call(): create carries initial value (tuple arity = 1)', () => {
      const init = { foo: 123 };
      const c = Wire.call(2, 'create', init);
      expect(c.method).to.eql('create');
      expect(c.args[0]).to.eql(init);
      expect(c.args.length).to.eql(1);

      expectTypeOf(c).toMatchTypeOf<t.WireCall<'create'>>();
      type Args = t.WireRepoArgs['create'];
      expectTypeOf(c.args).toMatchTypeOf<Args>();
    });

    it('call(): get takes id and optional options', () => {
      const c1 = Wire.call(3, 'get', 'doc-1');
      const c2 = Wire.call(4, 'get', 'doc-2', { timeout: 10 });

      expect(c1.args[0]).to.eql('doc-1');
      expect(c1.args.length).to.eql(1);

      expect(c2.args[0]).to.eql('doc-2');
      expect(c2.args[1]).to.eql({ timeout: 10 });
      expect(c2.args.length).to.eql(2);

      expectTypeOf(c1).toMatchTypeOf<t.WireCall<'get'>>();
      expectTypeOf(c2).toMatchTypeOf<t.WireCall<'get'>>();
    });

    it('ok(): result envelope', () => {
      const r = Wire.ok(5, { ok: true });
      expect(r.version).to.eql(WIRE_VERSION);
      expect(r.type).to.eql('result');
      expect(r.id).to.eql(5);
      expect(r.ok).to.eql(true);
      expect((r as t.WireResultOk).data).to.eql({ ok: true });

      expectTypeOf(r).toMatchTypeOf<t.WireResult>();
    });

    it('err(): result envelope', () => {
      const e: t.WireError = { kind: 'UNKNOWN', message: 'boom' };
      const r = Wire.err(6, e);
      expect(r.version).to.eql(WIRE_VERSION);
      expect(r.type).to.eql('result');
      expect(r.id).to.eql(6);
      expect(r.ok).to.eql(false);
      expect((r as t.WireResultErr).error).to.eql(e);

      expectTypeOf(r).toMatchTypeOf<t.WireResult>();
    });

    describe('errFrom(): normalization', () => {
      it('from Error instance', () => {
        const err = new Error('kapow');
        const w = Wire.errFrom(err, 'UNKNOWN');
        expect(w.kind).to.eql('UNKNOWN');
        expect(w.message).to.eql('kapow');
        expectTypeOf(w).toMatchTypeOf<t.WireError>();
      });

      it('from shaped object {kind,message,stack?}', () => {
        const shaped = { kind: 'Timeout' as t.WireErrorKind, message: 'late', stack: 'S' };
        const w = Wire.errFrom(shaped);
        expect(w.kind).to.eql('Timeout');
        expect(w.message).to.eql('late');
        expect(w.stack).to.eql('S');
      });

      it('from primitive value', () => {
        const w = Wire.errFrom(42, 'UNKNOWN');
        expect(w.kind).to.eql('UNKNOWN');
        expect(w.message).to.eql('42');
      });
    });

    describe('Wire.Stream (helpers)', () => {
      it('repo constant', () => {
        expect(Wire.Stream.repo).to.eql<'crdt:repo'>('crdt:repo');
        expectTypeOf(Wire.Stream.repo).toEqualTypeOf<'crdt:repo'>();
      });

      it('doc(id) formats stream id', () => {
        const id: t.StringId = 'abc123';
        const s = Wire.Stream.doc(id);
        expect(s).to.eql(`crdt:doc:${id}`);
        // type: template literal with string tail
        expectTypeOf(s).toEqualTypeOf<`crdt:doc:${string}`>();
      });

      it('isDoc guards correctly', () => {
        const a: t.WireStream = 'crdt:repo';
        const b: t.WireStream = Wire.Stream.doc('x');
        expect(Wire.Stream.isDoc(a)).to.eql(false);
        expect(Wire.Stream.isDoc(b)).to.eql(true);
      });
    });

    describe('Wire.clone', () => {
      it('Wire.clone returns a deep array copy, same scalars', () => {
        const p: t.CrdtRepoProps = {
          ready: true,
          id: { instance: 'i', peer: 'p' },
          sync: { peers: ['a' as t.PeerId], urls: ['u'], enabled: false },
          stores: [{ id: 's' } as unknown as t.CrdtRepoStoreInfo],
        };
        const out = Wire.clone(p);

        expect(out).to.eql(p);
        expect(out.sync.peers).to.not.equal(p.sync.peers);
        expect(out.sync.urls).to.not.equal(p.sync.urls);
        expect(out.stores).to.not.equal(p.stores);
      });
    });
  });
});
