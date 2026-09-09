const COMPOSED = Symbol('CellLifecycleFailures');

type ComposedFailure = AggregateError & { readonly [COMPOSED]: true };

/** Combines distinct lifecycle failures while retaining the initiating failure as cause. */
export function mergeFailures(primary: unknown, additional: unknown, message: string): unknown {
  if (containsFailure(primary, additional)) return primary;

  const errors: unknown[] = [];
  const seen = new Set<unknown>();
  appendFailure(primary, errors, seen);
  appendFailure(additional, errors, seen);
  if (errors.length === 1) return errors[0];

  const cause = isComposedFailure(primary) ? primary.cause : primary;
  const aggregate = new AggregateError(errors, message, { cause });
  Object.defineProperty(aggregate, COMPOSED, { value: true });
  return aggregate;
}

function appendFailure(input: unknown, errors: unknown[], seen: Set<unknown>): void {
  if (isComposedFailure(input)) {
    if (seen.has(input)) return;
    seen.add(input);
    for (const error of input.errors) appendFailure(error, errors, seen);
    return;
  }
  if (seen.has(input)) return;

  errors.push(input);
  reserveFailure(input, seen);
}

function reserveFailure(input: unknown, seen: Set<unknown>): void {
  if (seen.has(input)) return;
  seen.add(input);
  if (!(input instanceof AggregateError)) return;
  for (const error of input.errors) reserveFailure(error, seen);
}

function containsFailure(input: unknown, target: unknown, seen = new Set<unknown>()): boolean {
  if (Object.is(input, target)) return true;
  if (!(input instanceof AggregateError) || seen.has(input)) return false;

  seen.add(input);
  return input.errors.some((error) => containsFailure(error, target, seen));
}

function isComposedFailure(input: unknown): input is ComposedFailure {
  return input instanceof AggregateError && COMPOSED in input;
}
