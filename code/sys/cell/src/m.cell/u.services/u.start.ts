import { Dispose, type t } from './common.ts';
import { planServices } from './u.plan.ts';
import {
  activateService,
  closeHandle,
  serviceFailureOf,
  type ServiceState,
} from './u.start.service.ts';

export const start: t.Cell.Services.Lib['start'] = async (cell, options = {}) => {
  const plan = planServices(cell, options, 'Cell.Services.start');
  const batch = Dispose.abortable(options.until);
  const states = plan.services.map((planned) => ({
    planned,
    life: Dispose.abortable(batch.signal),
    closed: false,
    start: Promise.withResolvers<t.Cell.Services.StartedService>(),
  }));
  // Allocate every completion before scheduling, including forward references.
  const starts = new Map(states.map(({ planned, start }) => [planned.service.name, start.promise]));
  for (const state of states) {
    const after = state.planned.service.startAfter;
    const activate = () => activateService(cell, state, options);
    const operation = after?.length
      ? Promise.all(after.map((name) => starts.get(name)!)).then(activate)
      : activate();
    operation.then(state.start.resolve, state.start.reject);
  }

  try {
    const services = await Promise.all(starts.values());

    return {
      services,
      close: async (reason) => {
        batch.dispose(reason);
        await closeStates(states, reason);
      },
    };
  } catch (cause) {
    const failure = serviceFailureOf(cause);
    batch.dispose(failure.cause);

    let finalCause = failure.cause;
    try {
      await closeStates(states, failure.cause);
    } catch (closeCause) {
      finalCause = new AggregateError(
        [failure.cause, closeCause],
        `Cell.Services.start: service '${failure.name}' failed and cleanup also failed.`,
      );
    }

    throw new Error(`Cell.Services.start: failed to start service '${failure.name}'.`, {
      cause: finalCause,
    });
  }
};

/**
 * Helpers:
 */
async function closeStates(
  states: readonly ServiceState[],
  reason?: unknown,
): Promise<void> {
  const errors: unknown[] = [];

  for (const state of [...states].reverse()) {
    try {
      await closeState(state, reason);
    } catch (cause) {
      errors.push(cause);
    }
  }

  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Cell.Services.close: failed to close services.');
  }
}

async function closeState(state: ServiceState, reason?: unknown) {
  state.life.dispose(reason);
  if (state.closed) return;
  state.closed = true;
  if (state.active) await closeHandle(state.active.handle, reason);
}
