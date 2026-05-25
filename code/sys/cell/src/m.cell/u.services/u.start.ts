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
  let closing = false;
  let closeReason: unknown = 'cell.services.closed';
  const starts: Promise<t.Cell.Services.StartedService>[] = [];

  const states = plan.services.map((service) => {
    const state: ServiceState = {
      planned: service,
      life: Dispose.abortable(batch.signal),
      closed: false,
    };
    const promise = activateService(cell, state, options).then((started) => {
      state.active = started;
      if (closing) void closeState(state, closeReason).catch(() => undefined);
      return started;
    });
    starts.push(promise);
    return state;
  });

  try {
    const services = await Promise.all(starts);

    return {
      services,
      close: async (reason) => {
        closing = true;
        closeReason = reason;
        batch.dispose(reason);
        await closeStates(states, reason);
      },
    };
  } catch (cause) {
    const failure = serviceFailureOf(cause);
    closing = true;
    closeReason = failure.cause;
    batch.dispose(failure.cause);

    let finalCause = failure.cause;
    try {
      await closeStates(states, closeReason);
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
  const active = state.active;
  if (!active || state.closed) return;
  state.closed = true;
  await closeHandle(active.handle, reason);
}
