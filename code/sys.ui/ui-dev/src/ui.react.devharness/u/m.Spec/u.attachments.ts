import { Is, Rx, Signal, type t } from '../common.ts';
import { BusEvents } from '../m.Bus/Bus.Events.ts';

type Slot = { claim?: t.Lifecycle; incumbent?: t.Lifecycle };
type Shared = { effects: t.SignalListeners; members: number; acquiring: boolean };

/**
 * Compose specimen identity, harness retirement, and factory-local sharing once at their owner.
 * Signal.listeners still owns effect registration and its bounded teardown semantics.
 */
export const attachments: t.SpecLib['attachments'] = (options = {}) => {
  const { shared } = options;
  const slots = new WeakMap<t.DevCtx, Slot>();
  let generation: Shared | undefined;

  const attach: t.SpecAttachments['attach'] = (ctx, args) => {
    if (ctx.is?.attachable !== true) {
      const closed = Rx.lifecycle();
      closed.dispose();
      return closed;
    }
    if (generation?.acquiring) {
      throw new Error('Cannot attach while this owner is acquiring its shared effect');
    }

    const slot = slots.get(ctx) ?? {};
    let previousClaim = slot.claim;
    const completion = Rx.lifecycle();
    const effects = Signal.listeners();
    // Own wiring separately: release it before effects and completion publication.
    const subscriptions = new DisposableStack();
    let retired = false;
    let committed = false;
    let group: Shared | undefined;
    let subscribing = true;
    let wiringFailed = false;
    let wiringError: unknown;

    const dispose: t.Lifecycle['dispose'] = (reason) => {
      if (retired) return;
      retired = true; // Logical closure precedes every resource's physical teardown.
      if (slot.incumbent === life) slot.incumbent = undefined;
      if (slot.claim === life) {
        const rollback = previousClaim && !previousClaim.disposed ? previousClaim : slot.incumbent;
        slot.claim = committed ? undefined : rollback;
      }
      previousClaim = undefined;
      if (!slot.claim && !slot.incumbent && slots.get(ctx) === slot) slots.delete(ctx);

      const released = group;
      group = undefined;
      let last: Shared | undefined;
      if (released && --released.members === 0) {
        last = released;
        if (generation === released) generation = undefined;
      }
      // Detach ownership first: teardown may attach a successor to this very context.
      // Native stack disposal attempts each resource; no general dependency-release claim.
      using teardown = new DisposableStack();
      teardown.defer(() => completion.dispose(reason));
      if (last) teardown.defer(() => last.effects.dispose());
      teardown.defer(() => effects.dispose());
      teardown.defer(() => subscriptions.dispose());
    };
    const life: t.Lifecycle = {
      get disposed() {
        return retired;
      },
      dispose,
      dispose$: completion.dispose$,
      [Symbol.dispose]: () => dispose(),
    };
    slots.set(ctx, slot);
    slot.claim = life;

    const checkpoint = () => {
      if (!retired && slot.claim === life && ctx.is?.attachable === true) return true;
      dispose();
      return false;
    };
    const onError = (error: unknown) => {
      if (subscribing && !wiringFailed) {
        wiringFailed = true;
        wiringError = error;
      }
      try {
        dispose();
      } finally {
        // Later transport errors retain Rx's unhandled-error channel, not an attach-time throw.
        if (!subscribing) new Rx.Observable<never>((observer) => observer.error(error)).subscribe();
      }
    };
    const retain = (release: () => void) => {
      if (subscriptions.disposed) release();
      else subscriptions.defer(release);
    };
    const observe = <T>($: t.Observable<T>, next: (event: T) => void) => {
      const sub = $.subscribe({ next, error: onError });
      retain(() => sub.unsubscribe()); // A synchronous notification may have retired us already.
      if (wiringFailed) throw wiringError;
      return checkpoint();
    };

    try {
      try {
        if (!observe(ctx.dispose$, (e) => dispose(e.reason))) return life;
        const events = BusEvents({ instance: ctx.toObject().instance });
        retain(() => events.dispose());
        if (!observe(events.reset.before$, () => dispose())) return life;
      } finally {
        subscribing = false;
      }

      let startShared = false;
      if (shared) {
        if (!generation) {
          generation = { effects: Signal.listeners(), members: 0, acquiring: true };
          startShared = true;
        }
        group = generation;
        group.members++; // Reserve continuity before retiring this context's incumbent.
      }
      const predecessor = slot.incumbent;
      committed = true;
      previousClaim = undefined; // No rollback after handoff; do not retain an old-handle chain.
      slot.incumbent = life;
      predecessor?.dispose();
      if (!checkpoint()) return life;

      if (startShared && group && shared) {
        const acquired = group;
        register(acquired.effects, shared, () => acquired.members > 0);
        if (generation === acquired) acquired.acquiring = false;
        if (!checkpoint()) return life;
      }

      const { subject } = args;
      if (subject) {
        if ('size' in subject) {
          if (!checkpoint()) return life;
          if (Is.array(subject.size)) ctx.subject.size(subject.size);
          else ctx.subject.size(subject.size, subject.margin);
        }
        if ('display' in subject) {
          if (!checkpoint()) return life;
          ctx.subject.display(subject.display);
        }
        if (!checkpoint()) return life;
        ctx.subject.render(subject.render);
      }
      for (const effect of args.effects ?? []) {
        if (!checkpoint()) return life;
        register(effects, effect, () => !retired);
      }
      checkpoint();
      return life;
    } catch (error) {
      try {
        dispose();
      } catch {
        // Cleanup failure must not replace the initiating acquisition failure.
      }
      throw wiringFailed ? wiringError : error;
    }
  };

  return { attach };
};

/** Preserve initial callback failure before dependency teardown can replace its thrown value. */
function register(collection: t.SignalListeners, fn: t.SignalEffectFn, isLive: () => boolean) {
  let acquiring = true;
  let failed = false;
  let failure: unknown;
  try {
    collection.effect((event) => {
      if (!isLive()) return;
      try {
        return fn(event);
      } catch (error) {
        if (acquiring && !failed) {
          failed = true;
          failure = error;
        }
        throw error;
      }
    });
  } catch (error) {
    throw failed ? failure : error;
  } finally {
    acquiring = false;
  }
}
