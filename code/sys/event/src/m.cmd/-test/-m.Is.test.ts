import { describe, expect, it, type t } from '../../-test.ts';
import { CmdIs } from '../m.Is.ts';

describe('Cmd.Is', () => {
  describe('Cmd.Is.request', () => {
    it('matches a valid command envelope', () => {
      const msg = {
        kind: 'cmd',
        id: 'req-123',
        name: 'worker/ping',
        ns: 'worker',
        payload: { foo: 1 },
      };

      expect(CmdIs.request(msg)).to.eql(true);
    });

    it('rejects invalid command envelopes', () => {
      expect(CmdIs.request(null)).to.eql(false);
      expect(CmdIs.request(undefined)).to.eql(false);
      expect(CmdIs.request(123)).to.eql(false);
      expect(CmdIs.request('cmd')).to.eql(false);
      expect(CmdIs.request([])).to.eql(false);
      expect(CmdIs.request({ kind: 'cmd:result', id: 'req-123', name: 'foo' })).to.eql(false);
      expect(CmdIs.request({ kind: 'cmd', name: 'foo' })).to.eql(false);
      expect(CmdIs.request({ kind: 'cmd', id: 'req-123' })).to.eql(false);
      expect(CmdIs.request({ kind: 'cmd', id: '123', name: 'foo' })).to.eql(false);
      expect(CmdIs.request({ kind: 'cmd', id: 'req-', name: 'foo' })).to.eql(false);
      expect(CmdIs.request({ kind: 'cmd', id: 'req-123', name: '' })).to.eql(false);
      expect(CmdIs.request({ kind: 'cmd', id: 'req-123', name: 42 })).to.eql(false);
      expect(CmdIs.request({ kind: 'cmd', id: 'req-123', name: 'foo', ns: null })).to.eql(false);
    });
  });

  describe('Cmd.Is.event', () => {
    it('matches a valid event envelope', () => {
      const msg = {
        kind: 'cmd:event',
        id: 'req-123',
        name: 'worker/progress',
        payload: { step: 1 },
      };

      expect(CmdIs.event(msg)).to.eql(true);
    });

    it('rejects invalid event envelopes', () => {
      expect(CmdIs.event(null)).to.eql(false);
      expect(CmdIs.event(undefined)).to.eql(false);
      expect(CmdIs.event(123)).to.eql(false);
      expect(CmdIs.event('cmd:event')).to.eql(false);
      expect(CmdIs.event([])).to.eql(false);
      expect(CmdIs.event({ kind: 'cmd', id: 'req-123', name: 'foo' })).to.eql(false);
      expect(CmdIs.event({ kind: 'cmd:event', name: 'foo' })).to.eql(false);
      expect(CmdIs.event({ kind: 'cmd:event', id: 'req-123' })).to.eql(false);
      expect(CmdIs.event({ kind: 'cmd:event', id: '123', name: 'foo' })).to.eql(false);
      expect(CmdIs.event({ kind: 'cmd:event', id: 'req-123', name: '' })).to.eql(false);
      expect(CmdIs.event({ kind: 'cmd:event', id: 'req-123', name: 'foo', ns: 1 })).to.eql(false);
    });
  });

  describe('Cmd.Is.response', () => {
    it('matches a valid result envelope', () => {
      const msg = {
        kind: 'cmd:result',
        id: 'req-abc',
        name: 'worker/ping',
        payload: { reply: 'ok' },
      };

      expect(CmdIs.response(msg)).to.eql(true);
    });

    it('rejects invalid result envelopes', () => {
      expect(CmdIs.response(null)).to.eql(false);
      expect(CmdIs.response(undefined)).to.eql(false);
      expect(CmdIs.response(123)).to.eql(false);
      expect(CmdIs.response('cmd:result')).to.eql(false);
      expect(CmdIs.response([])).to.eql(false);
      expect(CmdIs.response({ kind: 'cmd', id: 'req-123', name: 'foo' })).to.eql(false);
      expect(CmdIs.response({ kind: 'cmd:result', name: 'foo' })).to.eql(false);
      expect(CmdIs.response({ kind: 'cmd:result', id: 'req-123' })).to.eql(false);
      expect(CmdIs.response({ kind: 'cmd:result', id: '123', name: 'foo' })).to.eql(false);
      expect(CmdIs.response({ kind: 'cmd:result', id: 'req-', name: 'foo' })).to.eql(false);
      expect(CmdIs.response({ kind: 'cmd:result', id: 'req-123', name: '' })).to.eql(false);
      expect(CmdIs.response({ kind: 'cmd:result', id: 'req-123', name: 'foo', ns: false })).to.eql(
        false,
      );
      expect(CmdIs.response({ kind: 'cmd:result', id: 'req-123', name: 'foo', error: 123 })).to.eql(
        false,
      );
    });
  });

  describe('Cmd.Is.cancel', () => {
    it('matches a valid cancel envelope', () => {
      const msg = {
        kind: 'cmd:cancel',
        id: 'req-abc',
        name: 'worker/ping',
        reason: 'timeout',
      };

      expect(CmdIs.cancel(msg)).to.eql(true);
    });

    it('rejects invalid cancel envelopes', () => {
      expect(CmdIs.cancel(null)).to.eql(false);
      expect(CmdIs.cancel(undefined)).to.eql(false);
      expect(CmdIs.cancel(123)).to.eql(false);
      expect(CmdIs.cancel('cmd:cancel')).to.eql(false);
      expect(CmdIs.cancel([])).to.eql(false);
      expect(CmdIs.cancel({ kind: 'cmd:cancel', name: 'foo' })).to.eql(false);
      expect(CmdIs.cancel({ kind: 'cmd:cancel', id: 'req-123' })).to.eql(false);
      expect(CmdIs.cancel({ kind: 'cmd:cancel', id: '123', name: 'foo' })).to.eql(false);
      expect(CmdIs.cancel({ kind: 'cmd:cancel', id: 'req-', name: 'foo' })).to.eql(false);
      expect(CmdIs.cancel({ kind: 'cmd:cancel', id: 'req-123', name: '' })).to.eql(false);
      expect(CmdIs.cancel({ kind: 'cmd:cancel', id: 'req-123', name: 'foo', reason: 1 })).to.eql(
        false,
      );
    });
  });

  describe('Cmd.Is.error', () => {
    it('returns true for known CmdError names', () => {
      const timeout = makeError('CmdError.Timeout');
      const disposed = makeError('CmdError.ClientDisposed');
      const remote = makeError('CmdError.Remote');
      const cancelled = makeError('CmdError.Cancelled');

      expect(CmdIs.error(timeout)).to.eql(true);
      expect(CmdIs.error(disposed)).to.eql(true);
      expect(CmdIs.error(remote)).to.eql(true);
      expect(CmdIs.error(cancelled)).to.eql(true);
    });

    it('returns false for unknown or non-error values', () => {
      const unknown = new Error('x');
      unknown.name = 'CmdErrorMadeUp';

      expect(CmdIs.error(unknown)).to.eql(false);
      expect(CmdIs.error(new Error('plain'))).to.eql(false);
      expect(CmdIs.error(undefined)).to.eql(false);
      expect(CmdIs.error(null)).to.eql(false);
      expect(CmdIs.error({})).to.eql(false);
      expect(CmdIs.error({ name: 'CmdError.Timeout' })).to.eql(false);
      expect(CmdIs.error({ name: 'CmdError.Timeout', message: 'x' })).to.eql(false);
    });
  });
});

/**
 * Helpers:
 */
function makeError(kind: t.Cmd.Error.Kind) {
  const err = new Error('x') as t.DeepMutable<t.Cmd.Error.Instance>;
  err.name = kind;
  return err;
}
