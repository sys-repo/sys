import { expectTypeOf } from '@sys/std/testing';
import { describe, expect, it, Rx, Signal, Spec, type t, TestSample, Time } from '../../-test.ts';
import { Harness } from '../../mod.ts';

/** Real contexts/controllers; owner behavior is independent of generated specimen policy. */
describe('Spec.attachments', () => {
  it('unused owner and closed admission → no acquisition or subject writes', async () => {
    using host = await fixture();
    const calls: string[] = [];
    const baseline = host.subscriptions;
    const owner = Spec.attachments({ shared: () => void calls.push('shared') });
    expect(host.subscriptions).to.eql(baseline);
    expect(calls).to.eql([]);
    const ctx: t.DevCtx = {
      ...host.ctx,
      get is() {
        return { ...host.ctx.is, attachable: false };
      },
      toObject() {
        calls.push('instance');
        return host.ctx.toObject();
      },
    };
    using denied = owner.attach(ctx, {
      subject: { size: [360, null], display: 'grid', render: () => null },
      effects: [() => void calls.push('effect')],
    });
    expect(denied.disposed).to.eql(true);
    expect(host.subscriptions).to.eql(baseline);
    expect(calls).to.eql([]);
    expect(host.ctx.toObject().props.subject.renderer).to.eql(undefined);
  });

  it('repeat init and independent hosts → one shared effect, one attachment per pair', async () => {
    using a = await fixture();
    using b = await fixture({ ...TestSample.instance(), bus: a.controller.instance.bus });
    const baseline = [a.subscriptions, b.subscriptions];
    const signal = Signal.create(0);
    const calls = { shared: 0, a: 0, b: 0 };
    const cleanups = { shared: 0, a: 0, b: 0 };
    const owner = Spec.attachments({
      shared: () => {
        signal.value;
        calls.shared++;
        return () => void cleanups.shared++;
      },
    });
    const effects = (key: 'a' | 'b') => [() => {
      signal.value;
      calls[key]++;
      return () => void cleanups[key]++;
    }];
    using first = owner.attach(a.ctx, { effects: effects('a') });
    using other = owner.attach(b.ctx, { effects: effects('b') });
    const joined = [a.subscriptions, b.subscriptions];
    using replacement = owner.attach(a.ctx, { effects: effects('a') });
    expect(first.disposed).to.eql(true);
    expect(other.disposed).to.eql(false);
    expect(replacement.disposed).to.eql(false);
    expect([a.subscriptions, b.subscriptions]).to.eql(joined);
    expect(calls).to.eql({ shared: 1, a: 2, b: 1 });
    expect(cleanups).to.eql({ shared: 0, a: 1, b: 0 });
    signal.value++;
    expect(calls).to.eql({ shared: 2, a: 3, b: 2 });
    replacement.dispose();
    signal.value++;
    expect(calls).to.eql({ shared: 3, a: 3, b: 3 });
    other.dispose();
    const stopped = { ...calls };
    signal.value++;
    first.dispose();
    expect(calls).to.eql(stopped);
    expect([a.subscriptions, b.subscriptions]).to.eql(baseline);
    expect(cleanups).to.eql({ shared: 3, a: 3, b: 3 });
  });

  for (const transition of ['reset', 'load', 'dispose'] as const) {
    it(`${transition} → retire before state observers can reactivate effects`, async () => {
      using host = await fixture();
      const signal = Signal.create(0);
      const calls: number[] = [];
      const owner = Spec.attachments();
      using attachment = owner.attach(host.ctx, { effects: [() => void calls.push(signal.value)] });
      const states: boolean[] = [];
      host.controller.info.changed$.subscribe((e) => {
        if (e.message !== 'reset') return;
        states.push(attachment.disposed);
        signal.value++;
      });
      if (transition === 'reset') await host.controller.reset.fire();
      if (transition === 'load') await host.controller.load.fire(Spec.describe('next', () => {}));
      if (transition === 'dispose') host.controller.dispose();
      signal.value++;
      expect(attachment.disposed).to.eql(true);
      expect(calls).to.eql([0]);
      expect(states).to.eql(transition === 'dispose' ? [] : [true]);
    });
  }

  it('missing admission and retained disposed context → no subscriptions or activation', async () => {
    using host = await fixture();
    let calls = 0;
    const owner = Spec.attachments({ shared: () => void calls++ });
    const legacy = { ...host.ctx, is: { initial: true } };
    const baseline = host.subscriptions;
    using missing = owner.attach(legacy as t.DevCtx, { effects: [() => void calls++] });
    expect(missing.disposed).to.eql(true);
    expect(host.subscriptions).to.eql(baseline);
    host.controller.dispose();
    using late = owner.attach(host.ctx, { effects: [() => void calls++] });
    expect(late.disposed).to.eql(true);
    expect(host.subscriptions).to.eql(0);
    expect(calls).to.eql(0);
  });

  it('closed admission during reset → denial does not replace the incumbent', async () => {
    using host = await fixture();
    const owner = Spec.attachments();
    const states: boolean[][] = [];
    const counts: number[][] = [];
    let calls = 0;
    host.controller.reset.before$.subscribe(() => {
      const before = host.subscriptions;
      using denied = owner.attach(host.ctx, { effects: [() => void calls++] });
      states.push([denied.disposed, incumbent.disposed]);
      counts.push([before, host.subscriptions]);
    });
    using incumbent = owner.attach(host.ctx, {});
    await host.controller.reset.fire();
    expect(states).to.eql([[true, false]]);
    expect(counts[0][0]).to.eql(counts[0][1]);
    expect(incumbent.disposed).to.eql(true);
    expect(calls).to.eql(0);
  });

  it('normal runs and failed imports → preserve the displayed attachment', async () => {
    using host = await fixture();
    const owner = Spec.attachments();
    let attachment: t.Lifecycle | undefined;
    let calls = 0;
    const signal = Signal.create(0);
    await host.controller.load.fire(Spec.describe('displayed', (e) => {
      e.it('init', (e) => {
        attachment = owner.attach(Spec.ctx(e), {
          effects: [() => {
            signal.value;
            calls++;
          }],
        });
      });
    }));
    await host.controller.run.fire();
    await host.controller.run.fire();
    const result = await host.controller.load.fire(Promise.reject(new Error('import failed')));
    expect(result.error).to.eql('import failed');
    signal.value++;
    expect(calls).to.eql(3);
    expect(attachment?.disposed).to.eql(false);
  });

  it('independent owners and same-bus instances → retirement stays local', async () => {
    using a = await fixture();
    using b = await fixture({ ...TestSample.instance(), bus: a.controller.instance.bus });
    const owner = Spec.attachments();
    const independent = Spec.attachments();
    using first = owner.attach(a.ctx, {});
    using second = independent.attach(a.ctx, {});
    using otherHost = owner.attach(b.ctx, {});
    first.dispose();
    expect([second.disposed, otherHost.disposed]).to.eql([false, false]);
    await a.controller.reset.fire();
    expect([second.disposed, otherHost.disposed]).to.eql([true, false]);
  });

  for (const transition of ['reset', 'dispose', 'replace'] as const) {
    it(`predecessor subscription teardown causes ${transition} → candidate cannot overtake it`, async () => {
      using host = await fixture();
      const owner = Spec.attachments();
      let onTeardown = () => {};
      let bridges = 0;
      const ctx = forwardContext(
        host.ctx,
        new Rx.Observable<t.DisposeEvent>((observer) => {
          bridges++;
          const sub = host.ctx.dispose$.subscribe(observer);
          return () => {
            bridges--;
            sub.unsubscribe();
            const run = onTeardown;
            onTeardown = () => {};
            run();
          };
        }),
      );
      let successor: t.Lifecycle | undefined;
      let reset: Promise<t.DevResetRes> | undefined;
      const calls: string[] = [];
      const signal = Signal.create(0);
      using first = owner.attach(ctx, {});
      onTeardown = () => {
        if (transition === 'reset') reset = host.controller.reset.fire();
        if (transition === 'dispose') host.controller.dispose();
        if (transition === 'replace') {
          successor = owner.attach(ctx, {
            effects: [() => {
              signal.value;
              calls.push('successor');
            }],
          });
        }
      };
      using candidate = owner.attach(ctx, { effects: [() => void calls.push('candidate')] });
      await reset;
      signal.value++;
      first.dispose(); // An old handle cannot remove the successor's claim.
      expect(first.disposed).to.eql(true);
      expect(candidate.disposed).to.eql(true);
      expect(calls).to.eql(transition === 'replace' ? ['successor', 'successor'] : []);
      expect(bridges).to.eql(transition === 'replace' ? 1 : 0);
      if (successor) {
        expect(successor.disposed).to.eql(false);
        using replacement = owner.attach(ctx, {});
        expect(successor.disposed).to.eql(true);
        expect(replacement.disposed).to.eql(false);
      }
    });
  }

  for (const mode of ['direct throw', 'context error', 'reset error'] as const) {
    it(`${mode} during wiring → preserve incumbent and release provisional resources`, async () => {
      using host = await fixture();
      const owner = Spec.attachments();
      const failure = new Error('wiring failed');
      let fail = false;
      let bridges = 0;
      const dispose$ = new Rx.Observable<t.DisposeEvent>((observer) => {
        if (fail && mode === 'context error') throw failure;
        bridges++;
        const sub = host.ctx.dispose$.subscribe(observer);
        return () => {
          bridges--;
          sub.unsubscribe();
        };
      });
      const ctx: t.DevCtx = {
        ...forwardContext(host.ctx, dispose$),
        get is() {
          return host.ctx.is;
        },
        get dispose$() {
          if (fail && mode === 'direct throw') throw failure;
          return dispose$;
        },
        toObject() {
          const object = host.ctx.toObject();
          if (!fail || mode !== 'reset error') return object;
          const bus: t.EventBus = {
            $: new Rx.Observable(() => {
              throw failure;
            }),
            fire: object.instance.bus.fire,
          };
          return { ...object, instance: { ...object.instance, bus } };
        },
      };
      const signal = Signal.create(0);
      let calls = 0;
      using incumbent = owner.attach(ctx, {
        effects: [() => {
          signal.value;
          calls++;
        }],
      });
      const baseline = host.subscriptions;
      fail = true;
      expect(capture(() => owner.attach(ctx, {}))).to.eql({ caught: true, error: failure });
      expect(incumbent.disposed).to.eql(false);
      expect([bridges, host.subscriptions]).to.eql([1, baseline]);
      signal.value++;
      expect(calls).to.eql(2);
      fail = false;
      using replacement = owner.attach(ctx, {});
      expect(incumbent.disposed).to.eql(true);
      expect(bridges).to.eql(1);
      replacement.dispose();
      expect(bridges).to.eql(0);
    });
  }

  it('wiring reports an error, returned teardown throws → preserve the first failure and incumbent', async () => {
    using host = await fixture();
    const owner = Spec.attachments();
    const failure = undefined;
    const secondary = new Error('late subscription teardown failed');
    let fail = false;
    let releases = 0;
    const ctx = forwardContext(
      host.ctx,
      new Rx.Observable<t.DisposeEvent>((observer) => {
        if (!fail) return host.ctx.dispose$.subscribe(observer);
        observer.error(failure);
        return () => {
          releases++;
          throw secondary;
        };
      }),
    );
    using incumbent = owner.attach(ctx, {});
    const baseline = host.subscriptions;
    fail = true;
    const result = capture(() => owner.attach(ctx, {}));
    expect(result.caught).to.eql(true);
    expect(result.error).to.equal(failure);
    expect(incumbent.disposed).to.eql(false);
    expect(releases).to.eql(1);
    expect(host.subscriptions).to.eql(baseline);
    fail = false;
    using retry = owner.attach(ctx, {});
    expect(incumbent.disposed).to.eql(true);
    expect(retry.disposed).to.eql(false);
  });

  it('wiring reentry establishes successor, then throws → failure cannot restore an older claim', async () => {
    using host = await fixture();
    const owner = Spec.attachments();
    const failure = new Error('old wiring failed');
    let onSubscribe = () => {};
    let bridges = 0;
    const ctx = forwardContext(
      host.ctx,
      new Rx.Observable<t.DisposeEvent>((observer) => {
        bridges++;
        observer.add(() => bridges--);
        observer.add(host.ctx.dispose$.subscribe(observer));
        const run = onSubscribe;
        onSubscribe = () => {};
        run();
      }),
    );
    using incumbent = owner.attach(ctx, {});
    let successor: t.Lifecycle | undefined;
    const signal = Signal.create(0);
    let calls = 0;
    onSubscribe = () => {
      successor = owner.attach(ctx, {
        effects: [() => {
          signal.value;
          calls++;
        }],
      });
      throw failure;
    };
    expect(capture(() => owner.attach(ctx, {}))).to.eql({ caught: true, error: failure });
    expect(incumbent.disposed).to.eql(true);
    expect(successor?.disposed).to.eql(false);
    expect(bridges).to.eql(1);
    signal.value++;
    expect(calls).to.eql(2);
    using replacement = owner.attach(ctx, {});
    expect(successor?.disposed).to.eql(true);
    expect(replacement.disposed).to.eql(false);
    expect(bridges).to.eql(1);
  });

  it('synchronous retirement during wiring → release a subscription returned after retirement', async () => {
    using host = await fixture();
    let bridges = 0;
    let calls = 0;
    const ctx = forwardContext(
      host.ctx,
      new Rx.Observable<t.DisposeEvent>((observer) => {
        bridges++;
        observer.next({ reason: 'during subscribe' });
        return () => bridges--;
      }),
    );
    using life = Spec.attachments({ shared: () => void calls++ }).attach(ctx, {
      effects: [() => void calls++],
    });
    expect(life.disposed).to.eql(true);
    expect({ bridges, calls }).to.eql({ bridges: 0, calls: 0 });
  });

  it('shared acquisition → reject same-owner reentry, but deny closed admission first', async () => {
    using a = await fixture();
    using b = await fixture();
    const independent = Spec.attachments();
    let nested: ReturnType<typeof capture> | undefined;
    let denied: t.Lifecycle | undefined;
    let other: t.Lifecycle | undefined;
    let forbidden = 0;
    const before = b.subscriptions;
    const owner = Spec.attachments({
      shared: () => {
        nested = capture(() => owner.attach(b.ctx, { effects: [() => void forbidden++] }));
        const closed: t.DevCtx = { ...b.ctx, is: { initial: true, attachable: false } };
        denied = owner.attach(closed, { effects: [() => void forbidden++] });
        other = independent.attach(b.ctx, {});
      },
    });
    using attachment = owner.attach(a.ctx, {});
    expect(nested?.caught).to.eql(true);
    expect(nested?.error).to.be.instanceOf(Error);
    expect(denied?.disposed).to.eql(true);
    expect(other?.disposed).to.eql(false);
    expect(attachment.disposed).to.eql(false);
    expect(forbidden).to.eql(0);
    other?.dispose();
    expect(b.subscriptions).to.eql(before);
    using joined = owner.attach(b.ctx, {}); // Settled generations are not an attach-stack lock.
    expect(joined.disposed).to.eql(false);
  });

  it('uncaught reentrant shared acquisition → release first candidate and permit a later retry', async () => {
    using host = await fixture();
    const baseline = host.subscriptions;
    let reenter = true;
    const owner = Spec.attachments({
      shared: () => {
        if (reenter) owner.attach(host.ctx, {});
      },
    });
    expect(capture(() => owner.attach(host.ctx, {})).caught).to.eql(true);
    expect(host.subscriptions).to.eql(baseline);
    reenter = false;
    using retry = owner.attach(host.ctx, {});
    expect(retry.disposed).to.eql(false);
  });

  it('shared activation retires, then acquires a successor → old unwind cannot close new generation', async () => {
    using a = await fixture();
    using b = await fixture();
    const signal = Signal.create(0);
    const calls: number[] = [];
    let cleanups = 0;
    let setup = 0;
    let successor: t.Lifecycle | undefined;
    const owner = Spec.attachments({
      shared: () => {
        calls.push(signal.value);
        if (calls.length === 1) {
          a.controller.dispose();
          successor = owner.attach(b.ctx, {});
        }
        return () => void cleanups++;
      },
    });
    using retired = owner.attach(a.ctx, {
      subject: { render: () => null },
      effects: [() => void setup++],
    });
    expect(retired.disposed).to.eql(true);
    expect(successor?.disposed).to.eql(false);
    expect(a.ctx.toObject().props.subject.renderer).to.eql(undefined);
    expect({ calls, cleanups, setup }).to.eql({ calls: [0, 0], cleanups: 1, setup: 0 });
    signal.value++;
    expect(calls).to.eql([0, 0, 1]);
    successor?.dispose();
    expect(cleanups).to.eql(3);
    signal.value++;
    expect(calls).to.eql([0, 0, 1]);
  });

  for (const phase of ['host', 'shared'] as const) {
    it(`${phase} cleanup reconnects → successor survives and logically retired callbacks stay silent`, async () => {
      using host = await fixture();
      const signal = Signal.create(0);
      const calls = { shared: 0, host: 0, successor: 0 };
      const cleanups = { shared: 0, host: 0 };
      let successor: t.Lifecycle | undefined;
      let reconnect = true;
      const resume = () => {
        if (!reconnect) return;
        reconnect = false;
        signal.value++; // Old collections can still be physically subscribed here.
        successor = owner.attach(host.ctx, {
          effects: [() => {
            signal.value;
            calls.successor++;
          }],
        });
      };
      const owner = Spec.attachments({
        shared: () => {
          signal.value;
          calls.shared++;
          return () => {
            cleanups.shared++;
            if (phase === 'shared') resume();
          };
        },
      });
      using old = owner.attach(host.ctx, {
        effects: [
          () => () => {
            cleanups.host++;
            if (phase === 'host') resume();
          },
          () => {
            signal.value;
            calls.host++;
          },
        ],
      });
      old.dispose();
      expect(successor?.disposed).to.eql(false);
      expect(calls).to.eql({ shared: 2, host: 1, successor: 1 });
      expect(cleanups).to.eql({ shared: 1, host: 1 });
      signal.value++;
      expect(calls).to.eql({ shared: 3, host: 1, successor: 2 });
      old.dispose();
      using next = owner.attach(host.ctx, {});
      expect(successor?.disposed).to.eql(true);
      expect(next.disposed).to.eql(false);
    });

    it(`${phase} cleanup during reset → previously unused owner acquires nothing`, async () => {
      using host = await fixture();
      let calls = 0;
      let denied: t.Lifecycle | undefined;
      const unused = Spec.attachments({ shared: () => void calls++ });
      const attempt = () => {
        denied = unused.attach(host.ctx, {
          subject: { render: () => null },
          effects: [() => void calls++],
        });
      };
      const owner = Spec.attachments({ shared: () => phase === 'shared' ? attempt : undefined });
      using life = owner.attach(host.ctx, {
        effects: [() => phase === 'host' ? attempt : undefined],
      });
      await host.controller.reset.fire();
      expect(life.disposed).to.eql(true);
      expect(denied?.disposed).to.eql(true);
      expect(host.ctx.toObject().props.subject.renderer).to.eql(undefined);
      expect(calls).to.eql(0);
    });
  }

  for (const setter of ['size', 'display', 'render'] as const) {
    it(`retirement during subject ${setter} → no later setter or effect`, async () => {
      using host = await fixture();
      const original = { ...host.ctx.subject };
      const calls: string[] = [];
      let reset: Promise<t.DevResetRes> | undefined;
      const after = (name: string) => {
        calls.push(name);
        if (name === setter) reset = host.controller.reset.fire();
      };
      host.ctx.subject.size = () => {
        const result = original.size([360, null]);
        after('size');
        return result;
      };
      host.ctx.subject.display = (value) => {
        const result = original.display(value);
        after('display');
        return result;
      };
      host.ctx.subject.render = (fn) => {
        const result = original.render(fn);
        after('render');
        return result;
      };
      using life = Spec.attachments().attach(host.ctx, {
        subject: { size: [360, null], display: 'grid', render: () => null },
        effects: [() => void calls.push('effect')],
      });
      await reset;
      const sequence = ['size', 'display', 'render'];
      expect(calls).to.eql(sequence.slice(0, sequence.indexOf(setter) + 1));
      expect(life.disposed).to.eql(true);
    });
  }

  it('retirement inside an initial effect → finish running callback, abort its run, skip later effects', async () => {
    using host = await fixture();
    let detached = 0;
    const signal = Signal.create(0, { unwatched: () => void detached++ });
    const calls: string[] = [];
    let cleanup = 0;
    let run: t.Abortable | undefined;
    using life = Spec.attachments().attach(host.ctx, {
      effects: [
        (e) => {
          run = e.life;
          signal.value;
          calls.push('start');
          host.controller.dispose();
          signal.value++;
          calls.push('finish');
          return () => void cleanup++;
        },
        () => void calls.push('later'),
      ],
    });
    signal.value++;
    expect(life.disposed).to.eql(true);
    expect(calls).to.eql(['start', 'finish']);
    expect({ cleanup, detached, aborted: run?.signal.aborted }).to.eql({
      cleanup: 1,
      detached: 1,
      aborted: true,
    });
  });

  it('effect reentry after shared acquisition → newer attachment wins without restarting shared work', async () => {
    using host = await fixture();
    let shared = 0;
    const calls: string[] = [];
    const signal = Signal.create(0);
    const owner = Spec.attachments({ shared: () => void shared++ });
    let successor: t.Lifecycle | undefined;
    using old = owner.attach(host.ctx, {
      effects: [
        () => {
          calls.push('start');
          successor = owner.attach(host.ctx, {
            effects: [() => {
              signal.value;
              calls.push('successor');
            }],
          });
          calls.push('finish');
        },
        () => void calls.push('later'),
      ],
    });
    signal.value++;
    expect(old.disposed).to.eql(true);
    expect(successor?.disposed).to.eql(false);
    expect(calls).to.eql(['start', 'successor', 'finish', 'successor']);
    expect(shared).to.eql(1);
  });

  for (const phase of ['shared', 'effect'] as const) {
    const failures = [
      ['Error', new Error('callback failed')],
      ['undefined', undefined],
      ['null', null],
      ['zero', 0],
      ['false', false],
      ['empty string', ''],
      ['object', { source: 'callback' }],
    ] as const;
    for (const [name, failure] of failures) {
      it(`${phase} throws ${name}, dependency teardown throws → preserve raw callback failure`, async () => {
        using a = await fixture();
        using b = await fixture();
        const teardown = new Error('dependency teardown failed');
        let detached = 0;
        const dependency = Signal.create(0, {
          unwatched() {
            detached++;
            throw teardown;
          },
        });
        let fail = true;
        const callback = () => {
          if (fail) {
            dependency.value;
            throw failure;
          }
        };
        const owner = Spec.attachments({ shared: phase === 'shared' ? callback : undefined });
        const stableOwner = phase === 'shared' ? Spec.attachments() : owner;
        const signal = Signal.create(0);
        let stableCalls = 0;
        using stable = stableOwner.attach(b.ctx, {
          effects: [() => {
            signal.value;
            stableCalls++;
          }],
        });
        const baseline = a.subscriptions;
        const args = { effects: phase === 'effect' ? [callback] : [] };
        const result = capture(() => owner.attach(a.ctx, args));
        expect(result.caught).to.eql(true);
        expect(result.error).to.equal(failure);
        expect(detached).to.eql(1); // This single dependency released; not a general release proof.
        expect(a.subscriptions).to.eql(baseline);
        expect(stable.disposed).to.eql(false);
        signal.value++;
        expect(stableCalls).to.eql(2);
        fail = false;
        using retry = owner.attach(a.ctx, args);
        expect(retry.disposed).to.eql(false);
      });
    }
  }

  it('subject setup fails after joining → preserve other host and shared generation', async () => {
    using a = await fixture();
    using b = await fixture();
    const signal = Signal.create(0);
    const calls = { shared: 0, a: 0, b: 0 };
    let sharedCleanup = 0;
    const owner = Spec.attachments({
      shared: () => {
        signal.value;
        calls.shared++;
        return () => void sharedCleanup++;
      },
    });
    using first = owner.attach(a.ctx, {
      effects: [() => {
        signal.value;
        calls.a++;
      }],
    });
    const baseline = b.subscriptions;
    const original = b.ctx.subject.render;
    const failure = new Error('subject failed');
    b.ctx.subject.render = () => {
      throw failure;
    };
    try {
      const result = capture(() => owner.attach(b.ctx, { subject: { render: () => null } }));
      expect(result).to.eql({ caught: true, error: failure });
      expect(b.subscriptions).to.eql(baseline);
      expect(first.disposed).to.eql(false);
      expect(sharedCleanup).to.eql(0);
    } finally {
      b.ctx.subject.render = original;
    }
    signal.value++;
    expect(calls).to.eql({ shared: 2, a: 2, b: 0 });
    using retry = owner.attach(b.ctx, {
      effects: [() => {
        signal.value;
        calls.b++;
      }],
    });
    expect(calls).to.eql({ shared: 2, a: 2, b: 1 });
    expect(retry.disposed).to.eql(false);
  });

  it('setup and subscription cleanup both throw → initiating failure wins, resources are attempted', async () => {
    using host = await fixture();
    const original = new Error('setup failed');
    const secondary = new Error('unsubscribe failed');
    let bridges = 0;
    const ctx = forwardContext(
      host.ctx,
      new Rx.Observable<t.DisposeEvent>((observer) => {
        bridges++;
        const sub = host.ctx.dispose$.subscribe(observer);
        return () => {
          bridges--;
          sub.unsubscribe();
          throw secondary;
        };
      }),
    );
    const baseline = host.subscriptions;
    const result = capture(() =>
      Spec.attachments().attach(ctx, {
        effects: [() => {
          throw original;
        }],
      })
    );
    expect(result.caught).to.eql(true);
    expect(result.error).to.equal(original);
    expect([bridges, host.subscriptions]).to.eql([0, baseline]);
  });

  it('later reactive failure → retain attachment and inherited synchronous error reporting', async () => {
    using host = await fixture();
    const signal = Signal.create(0);
    const failure = new Error('later failure');
    let calls = 0;
    using life = Spec.attachments().attach(host.ctx, {
      effects: [() => {
        calls++;
        if (signal.value === 1) throw failure;
      }],
    });
    expect(capture(() => signal.value = 1)).to.eql({ caught: true, error: failure });
    expect(life.disposed).to.eql(false);
    signal.value = 2;
    expect(calls).to.eql(3);
    life.dispose();
    signal.value = 3;
    expect(calls).to.eql(3);
  });

  for (const source of ['retirement stream', 'disposal subscriber'] as const) {
    it(`${source} fails after acquisition → preserve Rx reporting outside attach`, async () => {
      using host = await fixture();
      const failure = new Error(source);
      using reported = observeError(failure);
      const retirement = Rx.subject<t.DisposeEvent>();
      const ctx = forwardContext(host.ctx, retirement);
      const baseline = host.subscriptions;
      using life = Spec.attachments().attach(ctx, {});
      if (source === 'retirement stream') retirement.error(failure);
      else {
        life.dispose$.subscribe(() => {
          throw failure;
        });
        life.dispose();
      }
      await Time.wait(5);
      expect(life.disposed).to.eql(true);
      expect(host.subscriptions).to.eql(baseline);
      expect(reported.errors).to.eql([failure]);
    });
  }

  it('subject declaration → presence-based writes, existing sizing, and untouched renderer identity', async () => {
    using host = await fixture();
    const owner = Spec.attachments();
    const received: t.DevRendererArgs<{ count: number }>[] = [];
    const result = Promise.resolve(null);
    const render: t.DevRenderer<{ count: number }> = (args) => {
      received.push(args);
      return result;
    };
    using _centered = owner.attach(host.ctx, {
      subject: { size: [360, null], display: 'grid', render },
    });
    const props = () => host.ctx.toObject().props.subject;
    expect(props().size).to.eql({ mode: 'center', width: 360, height: undefined });
    expect(props().display).to.eql('grid');
    expect(props().renderer?.fn).to.equal(render);
    expect(received).to.eql([]); // Registration does not execute or await a renderer.
    const args: t.DevRendererArgs<{ count: number }> = {
      id: 'render',
      state: { count: 7 },
      size: host.ctx.toObject().props.size,
    };
    expect(props().renderer?.fn(args)).to.equal(result);
    expect(received[0]).to.equal(args);
    using _absent = owner.attach(host.ctx, { subject: { render } });
    expect(props().size?.mode).to.eql('center');
    expect(props().display).to.eql('grid');
    using _clear = owner.attach(host.ctx, {
      subject: { size: undefined, display: undefined, render },
    });
    expect(props().size).to.eql(undefined);
    expect(props().display).to.eql(undefined);
    using _fill = owner.attach(host.ctx, { subject: { size: 'fill-x', margin: [2, 4], render } });
    expect(props().size).to.eql({ mode: 'fill', x: true, y: false, margin: [2, 4, 2, 4] });
    const unchanged = props().renderer;
    using _noSubject = owner.attach(host.ctx, {});
    expect(props().renderer).to.equal(unchanged);
  });

  it('public types → existing effect and renderer contracts without async cleanup claims', () => {
    const args: t.SpecAttachmentArgs = {};
    const render: t.DevRenderer = () => null;
    const size: t.DevSubjectSize = [360, null];
    const asyncCallback = () => Promise.resolve();
    expectTypeOf(args.effects).toEqualTypeOf<readonly t.SignalEffectFn[] | undefined>();
    // @ts-expect-error Async effect callbacks do not satisfy the existing effect contract.
    expectTypeOf(asyncCallback).toMatchTypeOf<t.SignalEffectFn>();
    expectTypeOf(() => asyncCallback).toMatchTypeOf<t.SignalEffectFn>();
    // @ts-expect-error Undefined is not a renderer-clear operation.
    expectTypeOf({ render: undefined }).toMatchTypeOf<t.SpecAttachmentSubject>();
    // @ts-expect-error Margin belongs only to fill sizing, never a tuple.
    expectTypeOf({ render, size, margin: 1 }).toMatchTypeOf<t.SpecAttachmentSubject>();
    // @ts-expect-error A margin requires an explicit fill mode.
    expectTypeOf({ render, margin: 1 }).toMatchTypeOf<t.SpecAttachmentSubject>();
    expectTypeOf({ render, size: 'fill' as const, margin: 1 }).toMatchTypeOf<
      t.SpecAttachmentSubject
    >();
  });

  it('attach inside an effect → owned effects isolate dependencies; subject setup retains ambient tracking', async () => {
    using host = await fixture();
    const setup = Signal.create(0);
    const inner = Signal.create(0);
    const original = host.ctx.subject.size;
    host.ctx.subject.size = () => {
      setup.value;
      return original([360, null]);
    };
    const owner = Spec.attachments();
    const calls = { outer: 0, inner: 0 };
    const baseline = host.subscriptions;
    using ambient = Signal.listeners();
    ambient.effect(() => {
      calls.outer++;
      const life = owner.attach(host.ctx, {
        subject: { size: [360, null], render: () => null },
        effects: [() => {
          inner.value;
          calls.inner++;
        }],
      });
      return () => life.dispose();
    });
    inner.value++;
    expect(calls).to.eql({ outer: 1, inner: 2 });
    setup.value++;
    expect(calls).to.eql({ outer: 2, inner: 3 });
    ambient.dispose();
    expect(host.subscriptions).to.eql(baseline);
  });

  it('admission closes without notification → re-read before each subject operation', async () => {
    using host = await fixture();
    let open = true;
    const calls: string[] = [];
    const original = { ...host.ctx.subject };
    const ctx: t.DevCtx = {
      ...host.ctx,
      get is() {
        return { ...host.ctx.is, attachable: open && host.ctx.is.attachable };
      },
      subject: {
        ...original,
        size() {
          calls.push('size');
          open = false;
          return original.size([360, null]);
        },
        display(value) {
          calls.push('display');
          return original.display(value);
        },
        render(fn) {
          calls.push('render');
          return original.render(fn);
        },
      },
    };
    using life = Spec.attachments().attach(ctx, {
      subject: { size: [360, null], display: 'grid', render: () => null },
      effects: [() => void calls.push('effect')],
    });
    expect(life.disposed).to.eql(true);
    expect(host.ctx.is.attachable).to.eql(true); // Only the wrapper's live admission changed.
    expect(calls).to.eql(['size']);
  });

  it('nested wiring fails → restore the still-live provisional claim and complete its handoff', async () => {
    using host = await fixture();
    const owner = Spec.attachments();
    const failure = new Error('nested wiring failed');
    let onSubscribe = () => {};
    let nested: ReturnType<typeof capture> | undefined;
    let bridges = 0;
    const ctx = forwardContext(
      host.ctx,
      new Rx.Observable<t.DisposeEvent>((observer) => {
        bridges++;
        observer.add(() => bridges--);
        observer.add(host.ctx.dispose$.subscribe(observer));
        const run = onSubscribe;
        onSubscribe = () => {};
        run();
      }),
    );
    using incumbent = owner.attach(ctx, {});
    onSubscribe = () => {
      onSubscribe = () => {
        throw failure;
      };
      nested = capture(() => owner.attach(ctx, {}));
    };
    using candidate = owner.attach(ctx, {});
    expect(nested).to.eql({ caught: true, error: failure });
    expect(incumbent.disposed).to.eql(true);
    expect(candidate.disposed).to.eql(false);
    expect(bridges).to.eql(1);
    using replacement = owner.attach(ctx, {});
    expect(candidate.disposed).to.eql(true);
    expect(replacement.disposed).to.eql(false);
    expect(bridges).to.eql(1);
  });

  it('raw upstream teardown admits an attachment → forthcoming normalized disposal retires it', async () => {
    const upstream = Rx.subject<t.DisposeEvent>();
    let onBridgeRelease = () => {};
    const until = new Rx.Observable<t.DisposeEvent>((observer) => {
      const sub = upstream.subscribe(observer);
      return () => {
        sub.unsubscribe();
        onBridgeRelease();
      };
    });
    using host = await fixture(TestSample.instance(), until);
    const states: boolean[] = [];
    const signal = Signal.create(0);
    let calls = 0;
    let cleanups = 0;
    let attachment: t.Lifecycle | undefined;
    const owner = Spec.attachments();
    onBridgeRelease = () => {
      states.push(host.ctx.is.attachable);
      attachment = owner.attach(host.ctx, {
        effects: [() => {
          signal.value;
          calls++;
          return () => void cleanups++;
        }],
      });
    };
    host.controller.dispose$.subscribe(() => states.push(host.ctx.is.attachable));
    upstream.next({ reason: 'external' });
    expect(states).to.eql([true, false]);
    expect(attachment?.disposed).to.eql(true);
    signal.value++;
    expect({ calls, cleanups }).to.eql({ calls: 1, cleanups: 1 });
    expect(host.subscriptions).to.eql(0);
  });

  for (const mode of ['explicit', 'native', 'context'] as const) {
    it(`${mode} disposal → synchronous closure, one completion, and preserved reason`, async () => {
      using host = await fixture();
      const owner = Spec.attachments();
      const states: boolean[] = [];
      const reasons: unknown[] = [];
      const reason = { source: mode };
      using life = owner.attach(host.ctx, { effects: [() => () => states.push(life.disposed)] });
      life.dispose$.subscribe((e) => {
        reasons.push(e.reason);
        states.push(life.disposed);
      });
      if (mode === 'explicit') life.dispose(reason);
      if (mode === 'native') life[Symbol.dispose]();
      if (mode === 'context') host.controller.dispose(reason);
      life.dispose('ignored');
      expect(states).to.eql([true, true]);
      expect(reasons).to.eql([mode === 'native' ? undefined : reason]);
    });
  }

  it('first/last detach → release dependencies independently of callback silence', async () => {
    using a = await fixture();
    using b = await fixture();
    const attached = { shared: 0, a: 0, b: 0 };
    const detached = { shared: 0, a: 0, b: 0 };
    const dependency = (key: keyof typeof attached) =>
      Signal.create(0, {
        watched: () => void attached[key]++,
        unwatched: () => void detached[key]++,
      });
    const shared = dependency('shared');
    const hostA = dependency('a');
    const hostB = dependency('b');
    const baseline = [a.subscriptions, b.subscriptions];
    const owner = Spec.attachments({
      shared: () => {
        shared.value;
      },
    });
    using first = owner.attach(a.ctx, {
      effects: [() => {
        hostA.value;
      }],
    });
    using second = owner.attach(b.ctx, {
      effects: [() => {
        hostB.value;
      }],
    });
    expect(attached).to.eql({ shared: 1, a: 1, b: 1 });
    first.dispose();
    expect(detached).to.eql({ shared: 0, a: 1, b: 0 });
    second.dispose();
    expect(detached).to.eql({ shared: 1, a: 1, b: 1 });
    expect([a.subscriptions, b.subscriptions]).to.eql(baseline);
  });
});

/** Capture only the deliberately injected Rx error; unrelated failures remain visible. */
function observeError(failure: Error) {
  const errors: unknown[] = [];
  const handler = (event: ErrorEvent) => {
    if (event.error !== failure) return;
    event.preventDefault();
    errors.push(event.error);
  };
  addEventListener('error', handler);
  return { errors, [Symbol.dispose]: () => removeEventListener('error', handler) };
}

/** Preserve live admission when a test intercepts only retirement delivery. */
function forwardContext(ctx: t.DevCtx, dispose$: t.DevCtx['dispose$']): t.DevCtx {
  return {
    ...ctx,
    get is() {
      return ctx.is;
    },
    dispose$,
  };
}

/** Test raw thrown values without TestModel's error-truthiness interpretation. */
function capture(fn: () => unknown) {
  try {
    fn();
    return { caught: false, error: undefined };
  } catch (error) {
    return { caught: true, error };
  }
}

/** Count transport subscriptions without adding any implicit attachment retirement. */
async function fixture(input: t.DevInstance = TestSample.instance(), until?: t.UntilInput) {
  let subscriptions = 0;
  const bus: t.EventBus = {
    $: new Rx.Observable<t.Event>((observer) => {
      subscriptions++;
      const sub = input.bus.$.subscribe(observer);
      return () => {
        subscriptions--;
        sub.unsubscribe();
      };
    }),
    fire: (e) => input.bus.fire(e),
  };
  using resources = new DisposableStack();
  const controller = resources.use(
    Harness.Bus.Controller({ instance: { id: input.id, bus }, until }),
  );
  const ctx = await controller.ctx.get();
  const owned = resources.move();
  return {
    controller,
    ctx,
    get subscriptions() {
      return subscriptions;
    },
    [Symbol.dispose]: () => owned.dispose(),
  };
}
