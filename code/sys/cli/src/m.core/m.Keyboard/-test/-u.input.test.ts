import { EventEmitter } from 'node:events';
import { KeyPressEvent } from '@cliffy/keypress';
import { describe, Err, expect, it, type t, Time } from '../../../-test.ts';
import { Keyboard } from '../mod.ts';
import type { KeyboardInputDependencies, KeyboardInputStream } from '../t.input.ts';
import { bindWith } from '../u.bind.ts';
import { createInput } from '../u.input.ts';

describe('CLI: core / Keyboard input ownership', () => {
  it('waits for the deferred release barrier after immediate disposal', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const handle = bindWith({ onQuit() {} }, {
      isTerminal: () => true,
      keypress: () => owner,
    });
    if (!handle) throw new Error('Expected binding.');
    let settled = false;
    void handle.finished.then(() => (settled = true));
    handle.dispose();
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).to.eql(false);
    expect(owner.disposed).to.eql(false);
    fixture.flush();
    await handle.finished;
    expect(owner.disposed).to.eql(true);
    fixture.assertReleased();
  });

  it('decodes fields, modifiers and event identity from separate input chunks', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const iterator = owner[Symbol.asyncIterator]();
    const cases = [
      ['r', { key: 'r', ctrlKey: false, shiftKey: false, metaKey: false }],
      ['R', { key: 'r', ctrlKey: false, shiftKey: true, metaKey: false }],
      ['\x03', { key: 'c', ctrlKey: true, shiftKey: false, metaKey: false }],
      ['\x1b[1;5D', { key: 'left', ctrlKey: true, shiftKey: false, metaKey: false }],
      ['\x1br', { key: 'r', ctrlKey: false, shiftKey: false, metaKey: true }],
      ['\x1b', { key: 'escape', ctrlKey: false, shiftKey: false, metaKey: false }],
      ['[', { key: '[', ctrlKey: false, shiftKey: false, metaKey: false }],
    ] as const;
    for (const [bytes, expected] of cases) {
      const next = iterator.next();
      fixture.emit(bytes);
      const event = (await next).value;
      expect(event).to.be.instanceOf(KeyPressEvent);
      expect(event).to.include(expected);
      expect(event.sequence).to.eql(bytes);
      expect(event.altKey).to.eql(false);
      expect(event.cancelable).to.eql(true);
    }
    owner.dispose();
    fixture.flush();
    await owner.finished;
    fixture.assertReleased();
  });

  it('continues after malformed input and preserves the upstream repeat threshold', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const iterator = owner[Symbol.asyncIterator]();
    const first = iterator.next();
    fixture.emit('\x1b\x1b');
    fixture.emit('r');
    const event = (await first).value;
    expect(event.key).to.eql('r');
    expect(event.repeat).to.eql(false);
    const second = iterator.next();
    const now = Date.now;
    try {
      Date.now = () => event.timeStamp + 1;
      fixture.emit('r');
    } finally {
      Date.now = now;
    }
    const repeated = (await second).value;
    expect(repeated.repeat).to.eql(true);
    const third = iterator.next();
    try {
      Date.now = () => repeated.timeStamp + 100;
      fixture.emit('r');
    } finally {
      Date.now = now;
    }
    expect((await third).value.repeat).to.eql(false);
    owner.dispose();
    fixture.flush();
    await owner.finished;
    fixture.assertReleased();
  });

  it('competes for events and drops queued read-ahead on disposal', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const first = owner[Symbol.asyncIterator]();
    const second = owner[Symbol.asyncIterator]();
    const a = first.next();
    const b = second.next();
    fixture.emit('abc');
    expect((await a).value.key).to.eql('a');
    expect((await b).value.key).to.eql('b');
    owner.dispose();
    fixture.flush();
    await owner.finished;
    expect((await first.next()).done).to.eql(true);
    expect((await second.next()).done).to.eql(true);
    fixture.assertReleased();
  });

  for (const point of ['raw:on', 'on:error', 'on:end', 'on:data', 'resume']) {
    it(`rolls back partial acquisition at ${point}`, async () => {
      const fixture = inputFixture();
      fixture.fail(point);
      const owner = createInput(fixture.deps);
      const { result } = await Err.Try.run(() => owner[Symbol.asyncIterator]().next());
      expect(result.ok).to.eql(false);
      expect(result.error).to.equal(fixture.failure);
      fixture.flush();
      await owner.finished;
      fixture.assertReleased();
    });
  }

  for (const point of ['pause', 'off:data', 'off:end', 'raw:restore', 'barrier']) {
    it(`retains release authority after ${point} fails`, async () => {
      const fixture = inputFixture();
      const owner = createInput(fixture.deps);
      const next = owner[Symbol.asyncIterator]().next();
      fixture.fail(point);
      expect(() => owner.dispose()).to.throw('Keyboard input release failed.');
      expect(owner.disposed).to.eql(false);
      owner.dispose();
      fixture.flush();
      await owner.finished;
      expect((await next).done).to.eql(true);
      expect(owner.disposed).to.eql(true);
      fixture.assertReleased();
    });
  }

  it('reports deferred listener-release failure and retains the same owner for retry', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const next = owner[Symbol.asyncIterator]().next();
    fixture.fail('off:error');
    owner.dispose();
    fixture.flush();
    const { result } = await Err.Try.run(() => owner.finished);
    expect(result.ok).to.eql(false);
    expect(result.error).to.be.instanceOf(Error);
    expect(owner.disposed).to.eql(false);
    owner.dispose();
    fixture.flush();
    expect(owner.disposed).to.eql(true);
    expect((await next).done).to.eql(true);
    fixture.assertReleased();
  });

  it('listener finalization awaits its retry and retains the first release failure', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const handle = bindWith({ onQuit() {} }, {
      isTerminal: () => true,
      keypress: () => owner,
    });
    if (!handle) throw new Error('Expected binding.');
    fixture.fail('off:error');
    let settled = false;
    const outcome = (async () => {
      const { result } = await Err.Try.run(() => handle.finished);
      settled = true;
      return result;
    })();
    handle.dispose();
    fixture.flush();
    await Time.wait(0);
    expect(settled).to.eql(false);
    expect(owner.disposed).to.eql(false);
    fixture.flush();
    const result = await outcome;
    expect(result.ok).to.eql(false);
    expect(result.error).to.have.property('message', 'Keyboard disposal failed.');
    expect(owner.disposed).to.eql(true);
    fixture.assertReleased();
  });

  it('public shutdown retry awaits release after an earlier deferred failure', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const handle = bindWith({ onQuit() {}, onKey: () => 'stop' }, {
      isTerminal: () => true,
      keypress: () => owner,
    });
    if (!handle) throw new Error('Expected binding.');
    fixture.fail('off:error');
    fixture.emit('r');
    await fixture.scheduled;
    fixture.flush();
    const { result: initial } = await Err.Try.run(() => handle.finished);
    expect(initial.ok).to.eql(false);
    expect(initial.error).to.have.property('message', 'Keyboard disposal failed.');

    const originalFinished = handle.finished;
    let settled = false;
    const retried = (async () => {
      const { result } = await Err.Try.run(() => Keyboard.shutdown(handle));
      settled = true;
      return result;
    })();
    // Cross a turn without flushing native completion; a stale rejection must not win.
    await Time.wait(0);
    expect(settled).to.eql(false);
    fixture.flush();
    const result = await retried;
    expect(result.ok).to.eql(false);
    expect(result.error).to.equal(initial.error);
    expect(handle.finished).to.equal(originalFinished);
    fixture.assertReleased();
  });

  it('concurrent shutdown retry awaits release started while the prior join resumes', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const handle = bindWith({ onQuit() {}, onKey: () => 'stop' }, {
      isTerminal: () => true,
      keypress: () => owner,
    });
    if (!handle) throw new Error('Expected binding.');
    fixture.fail('off:error');
    fixture.emit('r');
    await fixture.scheduled;
    fixture.flush();
    const originalFinished = handle.finished;
    const { result: initial } = await Err.Try.run(() => originalFinished);
    expect(initial.ok).to.eql(false);
    expect(initial.error).to.have.property('message', 'Keyboard disposal failed.');

    fixture.fail('off:error');
    const settled: string[] = [];
    const first = (async () => {
      const { result } = await Err.Try.run(() => Keyboard.shutdown(handle));
      settled.push('first');
      return result;
    })();
    const attempt = owner.finished;
    let second: Promise<t.TryResult<void>> | undefined;
    // Register before the join awaits this attempt. Its rejection queues the second shutdown
    // after the inner completion check, but before the outer join resumes.
    void attempt.catch(() => {
      queueMicrotask(() => {
        second = (async () => {
          const { result } = await Err.Try.run(() => Keyboard.shutdown(handle));
          settled.push('second');
          return result;
        })();
      });
    });
    await Promise.resolve();
    fixture.flush();
    try {
      await Time.wait(0);
      if (!second) throw new Error('Expected concurrent shutdown.');
      expect(owner.finished).not.to.equal(attempt);
      expect(owner.disposed).to.eql(false);
      expect(settled).to.eql([]);
      fixture.flush();
      const firstResult = await first;
      const secondResult = await second;
      expect(firstResult.ok).to.eql(false);
      expect(secondResult.ok).to.eql(false);
      expect(firstResult.error).to.equal(initial.error);
      expect(secondResult.error).to.equal(initial.error);
      expect(handle.finished).to.equal(originalFinished);
      expect(owner.disposed).to.eql(true);
      fixture.assertReleased();
    } finally {
      fixture.flush();
    }
  });

  it('concurrent shutdown retries join a late error handler after the original outcome', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    let calls = 0;
    const handle = bindWith({
      onQuit() {},
      onKey: () => 'stop',
      async onError() {
        calls += 1;
        entered.resolve();
        await release.promise;
      },
    }, {
      isTerminal: () => true,
      keypress: () => owner,
    });
    if (!handle) throw new Error('Expected binding.');
    fixture.fail('off:error');
    fixture.emit('r');
    await fixture.scheduled;
    fixture.flush();
    const { result: initial } = await Err.Try.run(() => handle.finished);
    expect(initial.ok).to.eql(false);
    const first = Err.Try.run(() => Keyboard.shutdown(handle));
    fixture.emitter.emit('error', fixture.failure);
    fixture.flush();
    await entered.promise;
    let settled = false;
    const second = (async () => {
      const { result } = await Err.Try.run(() => Keyboard.shutdown(handle));
      settled = true;
      return result;
    })();
    await Time.wait(0);
    expect(settled).to.eql(false);
    release.resolve();
    const { result: firstResult } = await first;
    const secondResult = await second;
    expect(firstResult.ok).to.eql(false);
    expect(secondResult.ok).to.eql(false);
    expect(firstResult.error).to.equal(initial.error);
    expect(secondResult.error).to.equal(initial.error);
    expect(calls).to.eql(1);
    fixture.assertReleased();
  });

  for (const order of ['release-first', 'callback-first']) {
    for (const handlerThrows of [false, true]) {
      it(`input error during a held callback → ${order}, handler throws: ${handlerThrows}`, async () => {
        const fixture = inputFixture();
        const owner = createInput(fixture.deps);
        const entered = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        const handled = Promise.withResolvers<void>();
        const errors: unknown[] = [];
        const handle = bindWith({
          onQuit() {},
          async onKey() {
            entered.resolve();
            await release.promise;
          },
          onError(error) {
            errors.push(error);
            handled.resolve();
            if (handlerThrows) throw new Error('handler failure');
          },
        }, {
          isTerminal: () => true,
          keypress: () => owner,
        });
        if (!handle) throw new Error('Expected binding.');
        fixture.emit('r');
        await entered.promise;
        fixture.emitter.emit('error', fixture.failure);
        if (order === 'release-first') fixture.flush();
        release.resolve();
        await handled.promise;
        if (order === 'callback-first') fixture.flush();
        const { result } = await Err.Try.run(() => handle.finished);
        expect(errors.length).to.eql(1);
        expect(errors[0]).to.have.property('message', 'Keyboard listener failed.');
        expect(errors[0]).not.to.equal(fixture.failure);
        if (handlerThrows) {
          expect(result.ok).to.eql(false);
          expect(result.error).to.have.property('message', 'Keyboard error handler failed.');
        } else expect(result.ok).to.eql(true);
        fixture.assertReleased();
      });
    }
  }

  for (const mode of ['unhandled', 'handled', 'unavailable']) {
    it(`input error after cancellation → ${mode}, without another iterator pull`, async () => {
      const fixture = inputFixture();
      const owner = createInput(fixture.deps);
      const errors: unknown[] = [];
      const handle = bindWith({
        onQuit() {},
        onError: mode === 'unhandled' ? undefined : (error) => {
          errors.push(error);
        },
      }, {
        isTerminal: () => true,
        keypress: () => owner,
      });
      if (!handle) throw new Error('Expected binding.');
      handle.dispose();
      const cause = mode === 'unavailable'
        ? new Deno.errors.BadResource('closed')
        : fixture.failure;
      fixture.emitter.emit('error', cause);
      fixture.flush();
      const { result } = await Err.Try.run(() => handle.finished);
      if (mode === 'handled') {
        expect(result.ok).to.eql(true);
        expect(errors.length).to.eql(1);
        expect(errors[0]).to.have.property('message', 'Keyboard listener failed.');
      } else {
        expect(result.ok).to.eql(false);
        expect(errors).to.eql([]);
        const message = mode === 'unavailable'
          ? 'Keyboard listener unavailable.'
          : 'Keyboard listener failed.';
        expect(result.error).to.have.property('message', message);
      }
      fixture.assertReleased();
    });
  }

  it('retains undelivered input failure separately from completed release', async () => {
    const fixture = inputFixture();
    const owner = createInput(fixture.deps);
    const next = owner[Symbol.asyncIterator]().next();
    owner.dispose();
    fixture.emitter.emit('error', fixture.failure);
    fixture.flush();
    await owner.finished;
    expect(owner.takeInputFailure?.()?.cause).to.equal(fixture.failure);
    expect(owner.takeInputFailure?.()).to.eql(undefined);
    expect((await next).done).to.eql(true);
    fixture.assertReleased();
  });

  it('restores a borrowed stream that was already raw', async () => {
    const fixture = inputFixture(true);
    const owner = createInput(fixture.deps);
    const next = owner[Symbol.asyncIterator]().next();
    owner.dispose();
    fixture.flush();
    await owner.finished;
    await next;
    fixture.assertReleased();
  });
});

function inputFixture(rawBefore = false) {
  const emitter = new EventEmitter();
  const failure = new Error('injected input failure');
  const failures = new Set<string>();
  const barriers: (() => void)[] = [];
  const scheduled = Promise.withResolvers<void>();
  let raw = rawBefore;
  let reading = false;
  const step = (point: string) => {
    if (failures.delete(point)) throw failure;
  };
  const stream: KeyboardInputStream = {
    get isRaw() {
      return raw;
    },
    setRawMode(value) {
      raw = value;
      step(value ? 'raw:on' : 'raw:restore');
    },
    on(event, listener) {
      emitter.on(event, listener);
      step(`on:${event}`);
    },
    removeListener(event, listener) {
      step(`off:${event}`);
      emitter.removeListener(event, listener);
    },
    pause() {
      step('pause');
      reading = false;
    },
    resume() {
      reading = true;
      step('resume');
    },
  };
  const deps: KeyboardInputDependencies = {
    stdin: () => stream,
    afterPause(callback) {
      step('barrier');
      barriers.push(callback);
      scheduled.resolve();
    },
  };
  return {
    deps,
    scheduled: scheduled.promise,
    emitter,
    failure,
    fail: (point: string) => failures.add(point),
    emit: (bytes: string) => emitter.emit('data', new TextEncoder().encode(bytes)),
    flush() {
      for (const callback of barriers.splice(0)) callback();
    },
    assertReleased() {
      expect(raw).to.eql(rawBefore);
      expect(reading).to.eql(false);
      expect(emitter.eventNames()).to.eql([]);
      expect(barriers).to.eql([]);
    },
  };
}
