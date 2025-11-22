import { type t, describe, expect, it } from '../../-test.ts';
import { CmdIs } from '../m.Is.ts';

describe('Cmd.Is', () => {
  describe('Cmd.Is.request:', () => {
    it('matches a valid command envelope', () => {
      const msg = {
        kind: 'cmd',
        id: '123',
        name: 'worker/ping',
        payload: { foo: 1 },
      };

      expect(CmdIs.request(msg)).to.eql(true);
    });

    it('rejects non-record values', () => {
      expect(CmdIs.request(null)).to.eql(false);
      expect(CmdIs.request(undefined)).to.eql(false);
      expect(CmdIs.request(123)).to.eql(false);
      expect(CmdIs.request('cmd')).to.eql(false);
      expect(CmdIs.request([])).to.eql(false);
    });

    it('rejects wrong kind', () => {
      const msg = {
        kind: 'cmd:result',
        id: '123',
        name: 'worker/ping',
      };

      expect(CmdIs.request(msg)).to.eql(false);
    });

    it('rejects missing or invalid id/name', () => {
      const noId = { kind: 'cmd', name: 'foo' };
      const noName = { kind: 'cmd', id: '123' };
      const badId = { kind: 'cmd', id: 123, name: 'foo' };
      const badName = { kind: 'cmd', id: '123', name: 42 };

      expect(CmdIs.request(noId)).to.eql(false);
      expect(CmdIs.request(noName)).to.eql(false);
      expect(CmdIs.request(badId)).to.eql(false);
      expect(CmdIs.request(badName)).to.eql(false);
    });
  });

  describe('Cmd.Is.response:', () => {
    it('matches a valid result envelope', () => {
      const msg = {
        kind: 'cmd:result',
        id: 'abc',
        name: 'worker/ping',
        payload: { reply: 'ok' },
      };
      expect(CmdIs.response(msg)).to.eql(true);
    });

    it('rejects non-record values', () => {
      expect(CmdIs.response(null)).to.eql(false);
      expect(CmdIs.response(undefined)).to.eql(false);
      expect(CmdIs.response(123)).to.eql(false);
      expect(CmdIs.response('cmd:result')).to.eql(false);
      expect(CmdIs.response([])).to.eql(false);
    });

    it('rejects wrong kind', () => {
      const msg = {
        kind: 'cmd',
        id: 'abc',
        name: 'worker/ping',
      };

      expect(CmdIs.response(msg)).to.eql(false);
    });

    it('rejects missing or invalid id/name', () => {
      const noId = { kind: 'cmd:result', name: 'foo' };
      const noName = { kind: 'cmd:result', id: '123' };
      const badId = { kind: 'cmd:result', id: 123, name: 'foo' };
      const badName = { kind: 'cmd:result', id: '123', name: 42 };

      expect(CmdIs.response(noId)).to.eql(false);
      expect(CmdIs.response(noName)).to.eql(false);
      expect(CmdIs.response(badId)).to.eql(false);
      expect(CmdIs.response(badName)).to.eql(false);
    });
  });

  describe('Cmd.Is.error:', () => {
    it('returns true for a valid CmdErrorTimeout', () => {
      const err = new Error('x') as t.CmdError;
      err.name = 'CmdErrorTimeout';
      err.cmd = { name: 'foo', id: 'req-123' };

      expect(CmdIs.error(err)).to.eql(true);
    });

    it('returns true for a valid CmdErrorClientDisposed (no meta)', () => {
      const err = new Error('x') as t.CmdError;
      err.name = 'CmdErrorClientDisposed';

      expect(CmdIs.error(err)).to.eql(true);
    });

    it('returns true for CmdErrorRemote', () => {
      const err = new Error('boom') as t.CmdError;
      err.name = 'CmdErrorRemote';
      err.cmd = { name: 'fail', id: 'req-abc' };

      expect(CmdIs.error(err)).to.eql(true);
    });

    it('returns false for Error with non-CmdError name', () => {
      const err = new Error('nope');
      err.name = 'SomethingElse';

      expect(CmdIs.error(err)).to.eql(false);
    });

    it('returns false for plain Error (default name)', () => {
      const err = new Error('nope');
      // Default name is "Error"
      expect(CmdIs.error(err)).to.eql(false);
    });

    it('returns false for non-error values', () => {
      expect(CmdIs.error(undefined)).to.eql(false);
      expect(CmdIs.error(null)).to.eql(false);
      expect(CmdIs.error({})).to.eql(false);
      expect(CmdIs.error({ name: 'CmdErrorTimeout' })).to.eql(false);
      expect(CmdIs.error({ name: 'CmdErrorTimeout', message: 'x' })).to.eql(false);
    });
  });
});
