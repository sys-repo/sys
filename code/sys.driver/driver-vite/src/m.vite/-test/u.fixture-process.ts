import { Arr, Err, Is, Num, Obj, Str, stripAnsi, type t, Time } from '../../-test.ts';

export type FixtureProcessResult = {
  readonly code: number;
  readonly signal?: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly text: string;
  readonly markerReached: boolean;
  readonly timeout?: { readonly phase: 'startup' | 'execution'; readonly killError?: Error };
  readonly captureError?: Error;
};

type CapturedStatus = {
  readonly code: number;
  readonly signal?: string;
  readonly error?: Error;
};

type CapturedOutput = {
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: Error;
};

type DeadlineResult<T> = { readonly kind: 'value'; readonly value: T } | {
  readonly kind: 'timeout';
};

/** Run a Deno fixture with independently bounded startup, execution, and output-drain phases. */
export async function runFixtureProcess(options: {
  readonly label: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly marker: string;
  readonly startupTimeout: t.Msecs;
  readonly executionTimeout: t.Msecs;
  readonly drainTimeout: t.Msecs;
}): Promise<FixtureProcessResult> {
  const duration = {
    startup: Num.clamp(1, Num.MAX_INT, options.startupTimeout),
    execution: Num.clamp(1, Num.MAX_INT, options.executionTimeout),
    drain: Num.clamp(1, Num.MAX_INT, options.drainTimeout),
  } as const;
  const child = new Deno.Command(Deno.execPath(), {
    args: [...options.args],
    cwd: options.cwd,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  const markerReached = Promise.withResolvers<void>();
  let markerSeen = false;
  const observeStdout = (text: string) => {
    if (markerSeen || !stripAnsi(text).includes(options.marker)) return;
    markerSeen = true;
    markerReached.resolve();
  };
  const status = captureStatus(child);
  const output = captureOutput(child, observeStdout);

  const startup = await withDeadline(
    Promise.race([
      markerReached.promise.then(() => ({ kind: 'marker' as const })),
      status.then((value) => ({ kind: 'completed' as const, value })),
    ]),
    duration.startup,
  );
  if (startup.kind === 'timeout') {
    return await terminateChild(
      child,
      status,
      output,
      options.marker,
      duration.drain,
      'startup',
      options.label,
    );
  }
  if (startup.value.kind === 'completed') {
    return await completeChild(
      startup.value.value,
      output,
      options.marker,
      duration.drain,
      options.label,
    );
  }

  const execution = await withDeadline(status, duration.execution);
  if (execution.kind === 'timeout') {
    return await terminateChild(
      child,
      status,
      output,
      options.marker,
      duration.drain,
      'execution',
      options.label,
    );
  }
  return await completeChild(
    execution.value,
    output,
    options.marker,
    duration.drain,
    options.label,
  );
}

async function completeChild(
  status: CapturedStatus,
  output: Promise<CapturedOutput>,
  marker: string,
  drainTimeout: t.Msecs,
  label: string,
): Promise<FixtureProcessResult> {
  const drain = await withDeadline(output, drainTimeout);
  if (drain.kind === 'timeout') {
    throw new Error(`${label} output did not drain within ${drainTimeout}ms after process exit.`);
  }
  return toResult(status, drain.value, marker);
}

async function terminateChild(
  child: Deno.ChildProcess,
  status: Promise<CapturedStatus>,
  output: Promise<CapturedOutput>,
  marker: string,
  drainTimeout: t.Msecs,
  phase: 'startup' | 'execution',
  label: string,
): Promise<FixtureProcessResult> {
  let killError: Error | undefined;
  try {
    child.kill('SIGKILL');
  } catch (primaryError) {
    try {
      child.kill();
    } catch (fallbackError) {
      const observed = await withDeadline(status, 100 satisfies t.Msecs);
      if (observed.kind === 'timeout') {
        killError = new AggregateError(
          [Err.normalize(primaryError), Err.normalize(fallbackError)],
          `Failed to terminate ${label}.`,
        );
      }
    }
  }

  const drain = await withDeadline(Promise.all([status, output]), drainTimeout);
  if (drain.kind === 'timeout') {
    throw new Error(`${label} did not drain within ${drainTimeout}ms after its ${phase} timeout.`);
  }
  const [capturedStatus, capturedOutput] = drain.value;
  return toResult(capturedStatus, capturedOutput, marker, { phase, killError });
}

async function captureStatus(child: Deno.ChildProcess): Promise<CapturedStatus> {
  try {
    const status = await child.status;
    return {
      code: status.code,
      signal: Is.string(status.signal) ? status.signal : undefined,
    };
  } catch (error) {
    return { code: -1, error: Err.normalize(error) };
  }
}

async function captureOutput(
  child: Deno.ChildProcess,
  onStdout: (text: string) => void,
): Promise<CapturedOutput> {
  const [stdout, stderr] = await Promise.allSettled(
    [readOutput(child.stdout, onStdout), readOutput(child.stderr)] as const,
  );
  const errors = Arr.uniq(
    [stdout, stderr]
      .filter((result) => result.status === 'rejected')
      .map((result) => Err.normalize(result.reason)),
  );
  return {
    stdout: stdout.status === 'fulfilled' ? stdout.value : '',
    stderr: stderr.status === 'fulfilled' ? stderr.value : '',
    error: combineErrors(errors, 'Failed to capture fixture output.'),
  };
}

async function readOutput(
  stream: ReadableStream<Uint8Array>,
  onOutput?: (text: string) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';
  for await (const chunk of stream) {
    text += decoder.decode(chunk, { stream: true });
    onOutput?.(text);
  }
  text += decoder.decode();
  onOutput?.(text);
  return text;
}

async function withDeadline<T>(
  promise: Promise<T>,
  duration: t.Msecs,
): Promise<DeadlineResult<T>> {
  const deadline = Time.delay(duration);
  try {
    return await Promise.race([
      promise.then((value): DeadlineResult<T> => ({ kind: 'value', value })),
      deadline.then((): DeadlineResult<T> => ({ kind: 'timeout' })),
    ]);
  } finally {
    deadline.cancel();
  }
}

function toResult(
  status: CapturedStatus,
  output: CapturedOutput,
  marker: string,
  timeout?: FixtureProcessResult['timeout'],
): FixtureProcessResult {
  const text = Str.trimEdgeNewlines(
    Obj.entries({ stdout: output.stdout, stderr: output.stderr })
      .map(([, value]) => stripAnsi(value))
      .filter(Is.string)
      .join('\n'),
  );
  const captureError = combineErrors(
    [status.error, output.error].filter(Is.error),
    'Failed to capture fixture process.',
  );
  return {
    code: status.code,
    signal: status.signal,
    stdout: output.stdout,
    stderr: output.stderr,
    text,
    markerReached: stripAnsi(output.stdout).includes(marker),
    timeout,
    captureError,
  };
}

function combineErrors(errors: readonly Error[], message: string): Error | undefined {
  if (errors.length === 0) return undefined;
  if (errors.length === 1) return errors[0];
  return new AggregateError(errors, message);
}
