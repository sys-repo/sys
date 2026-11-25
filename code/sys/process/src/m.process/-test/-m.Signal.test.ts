import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Process as Root } from '../../mod.ts';
import { Process } from '../mod.ts';
import { createSignalOn } from '../u/u.signal.ts';

describe('Process.Signal', () => {
  it('owns the only public OS signal registration method', () => {
    expect(Root.Signal).to.equal(Process.Signal);
    expect(Object.keys(Process.Signal)).to.have.members(['on', 'ready']);
    expect('onSignal' in Process).to.eql(false);
    expectTypeOf(Process.Signal.on).toEqualTypeOf<
      (
        name: 'SIGINT' | 'SIGTERM' | 'SIGHUP' | 'SIGWINCH',
        handler: () => void,
      ) => t.Process.Signal.Subscription
    >();
    expect(Process.readyToken).to.eql('PROCESS_READY');
    expect(Process.Signal.ready).to.eql(Process.readyToken);
  });

  it('requires both native methods before registering', () => {
    const unexpected = () => {
      throw new Error('Unexpected native listener call.');
    };
    const providers = [
      undefined,
      { addSignalListener: unexpected },
      { removeSignalListener: unexpected },
    ];
    for (const provider of providers) {
      const on = createSignalOn(() => provider);
      expect(on('SIGINT', () => undefined)).to.eql({ kind: 'unsupported' });
    }
  });

  it('preserves unexpected registration and callback failures', () => {
    const failure = new Error('native registration failed');
    const on = createSignalOn(() => ({
      addSignalListener() {
        throw failure;
      },
      removeSignalListener() {},
    }));
    expect(() => on('SIGTERM', () => undefined)).to.throw(failure);

    const callbackFailure = new Error('caller failed');
    let listener: (() => void) | undefined;
    const subscribe = createSignalOn(() => ({
      addSignalListener(_name, handler) {
        listener = handler;
      },
      removeSignalListener() {},
    }));
    const attachment = subscribe('SIGTERM', () => {
      throw callbackFailure;
    });
    if (attachment.kind !== 'attached' || !listener) throw new Error('Expected attachment.');
    try {
      expect(listener).to.throw(callbackFailure);
    } finally {
      attachment.dispose();
    }
  });

  it('removes the exact wrapper owned by each attachment of the same caller', () => {
    const added: Array<() => void> = [];
    const removed: Array<() => void> = [];
    const provider = {
      addSignalListener(_name: t.Process.Signal.Name, handler: () => void) {
        expect(this).to.equal(provider);
        added.push(handler);
      },
      removeSignalListener(_name: t.Process.Signal.Name, handler: () => void) {
        expect(this).to.equal(provider);
        removed.push(handler);
      },
    };
    const on = createSignalOn(() => provider);
    const handler = () => undefined;
    const first = on('SIGTERM', handler);
    const second = on('SIGTERM', handler);
    if (first.kind !== 'attached' || second.kind !== 'attached') {
      throw new Error('Expected two attachments.');
    }
    expect(added).to.have.length(2);
    expect(added[0]).not.to.equal(added[1]);

    first.dispose();
    expect(removed).to.have.length(1);
    expect(removed[0]).to.equal(added[0]);
    second.dispose();
    expect(removed).to.have.length(2);
    expect(removed[1]).to.equal(added[1]);
  });

  it('retains the original registration across a provider swap and a failed removal', () => {
    const failure = new Error('native removal failed');
    const removed: Array<{ name: t.Process.Signal.Name; handler: () => void }> = [];
    let nativeHandler: (() => void) | undefined;
    const unexpected = () => {
      throw new Error('Used the wrong native method.');
    };
    const original = {
      addSignalListener(name: t.Process.Signal.Name, handler: () => void) {
        expect(name).to.eql('SIGHUP');
        nativeHandler = handler;
      },
      removeSignalListener(name: t.Process.Signal.Name, handler: () => void) {
        removed.push({ name, handler });
        if (removed.length === 1) throw failure;
      },
    };
    let provider = original;
    const on = createSignalOn(() => provider);
    const attachment = on('SIGHUP', () => undefined);
    if (attachment.kind !== 'attached' || !nativeHandler) throw new Error('Expected attachment.');
    provider = { addSignalListener: unexpected, removeSignalListener: unexpected };
    original.removeSignalListener = unexpected;

    expect(() => attachment.dispose()).to.throw(failure);
    attachment.dispose();
    attachment.dispose();
    expect(removed.map(({ name }) => name)).to.eql(['SIGHUP', 'SIGHUP']);
    for (const { handler } of removed) expect(handler).to.equal(nativeHandler);
  });
});
