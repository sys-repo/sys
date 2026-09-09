export type FailureEvent<P extends string> = {
  readonly phase: P;
  readonly error: unknown;
  active: boolean;
};

export type FailureRecord<P extends string> = {
  readonly phases: readonly P[];
  readonly error: unknown;
};

export type FailureLedger<P extends string> = {
  readonly hasFailures: boolean;
  record(phase: P, error: unknown): FailureEvent<P>;
  recordThrown(phase: P, error: unknown): void;
  /** Deactivate exactly the supplied provisional observations without erasing later records. */
  discard(events: readonly FailureEvent<P>[]): void;
  records(): readonly FailureRecord<P>[];
  toError(message: string, name: string): unknown;
};

/** Preserve causal order while coalescing repeated observations of one failure identity. */
export function createFailureLedger<P extends string>(): FailureLedger<P> {
  const events: FailureEvent<P>[] = [];
  const has = (error: unknown) =>
    events.some((event) => event.active && Object.is(event.error, error));

  const record = (phase: P, error: unknown): FailureEvent<P> => {
    const event = { phase, error, active: true };
    events.push(event);
    return event;
  };

  const records = (): readonly FailureRecord<P>[] => {
    const output: { phases: P[]; error: unknown }[] = [];
    for (const event of events) {
      if (!event.active) continue;
      const existing = output.find((record) => Object.is(record.error, event.error));
      if (!existing) {
        output.push({ phases: [event.phase], error: event.error });
      } else if (!existing.phases.includes(event.phase)) {
        existing.phases.push(event.phase);
      }
    }
    return output;
  };

  return {
    get hasFailures() {
      return events.some((event) => event.active);
    },
    record,
    recordThrown(phase, error) {
      if (
        error instanceof AggregateError &&
        error.errors.length > 0 &&
        error.errors.every((item) => has(item))
      ) {
        for (const item of error.errors) record(phase, item);
        return;
      }
      record(phase, error);
    },
    discard(discarded) {
      for (const event of discarded) event.active = false;
    },
    records,
    toError(message, name) {
      const failures = records();
      if (failures.length === 1 && failures[0].phases.length === 1) {
        return failures[0].error;
      }
      return Object.assign(
        new AggregateError(failures.map((failure) => failure.error), message, {
          cause: failures[0]?.error,
        }),
        { name, failures },
      );
    },
  };
}
