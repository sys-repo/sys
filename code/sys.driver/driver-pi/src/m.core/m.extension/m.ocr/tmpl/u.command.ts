import type { CommandInput, CommandOutput, CommandRunner, OcrPolicy } from './t.ts';
import { formatStderr, toErrorMessage } from './u.result.ts';

const COMMAND_STDOUT_BYTES = 64_000;
const COMMAND_STDERR_BYTES = 64_000;
const COMMAND_KILL_GRACE_MS = 1_000;

type CapturedStream = {
  readonly data: Uint8Array;
  readonly truncated: boolean;
};

type CapturedStreams = {
  readonly stdout: CapturedStream;
  readonly stderr: CapturedStream;
};

type StatusResult =
  | { readonly ok: true; readonly status: Deno.CommandStatus }
  | { readonly ok: false; readonly error: unknown };

type TerminalTrigger =
  | { readonly kind: 'status'; readonly result: StatusResult }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'cancelled' };

type CancellablePromise<T> = {
  readonly promise: Promise<T>;
  cancel(): void;
};

export async function runBudgetedCommand(input: {
  readonly label: string;
  readonly cmd: string;
  readonly args: readonly string[];
  readonly deadline: number;
  readonly policy: OcrPolicy;
  readonly command: CommandRunner;
  readonly signal?: AbortSignal;
}) {
  const timeoutMs = input.deadline - Date.now();
  if (timeoutMs <= 0) {
    return {
      ok: false as const,
      reason:
        `OCR command budget exceeded before ${input.label} could start (${input.policy.pdf.timeoutMs}ms).`,
      substrate: false,
    };
  }
  if (input.signal?.aborted) {
    return {
      ok: false as const,
      reason: `OCR command was cancelled before ${input.label} could start.`,
      substrate: false,
    };
  }

  const caps = commandCaps(input.label, input.policy);
  let output: CommandOutput;
  try {
    output = await input.command({
      cmd: input.cmd,
      args: input.args,
      timeoutMs,
      ...caps,
      signal: input.signal,
    });
  } catch (error) {
    if (input.signal?.aborted) {
      return {
        ok: false as const,
        reason: `${input.label} command was cancelled.`,
        substrate: false,
      };
    }
    return {
      ok: false as const,
      reason: `${input.label} command runner failed: ${toErrorMessage(error)}`,
      substrate: false,
    };
  }
  if (output.cancelled) {
    return {
      ok: false as const,
      reason: `${input.label} command was cancelled.`,
      substrate: false,
    };
  }
  if (output.timedOut) {
    return {
      ok: false as const,
      reason:
        `${input.label} command exceeded OCR timeout budget (${input.policy.pdf.timeoutMs}ms).`,
      substrate: false,
    };
  }
  if (output.failedToStart) {
    return {
      ok: false as const,
      reason: `${input.label} command could not start: ${input.cmd}.${
        formatStderr(output.stderr)
      } Install with: ${input.policy.installCommand.text}`,
      substrate: true,
    };
  }
  if (output.code !== 0) {
    return {
      ok: false as const,
      reason: `${input.label} command failed with exit code ${output.code}.${
        formatStderr(output.stderr)
      }`,
      substrate: false,
    };
  }

  return { ok: true as const, output };
}

export async function runDenoCommand(input: CommandInput): Promise<CommandOutput> {
  if (input.signal?.aborted) return stoppedOutput(-1, emptyStreams(), 'cancelled');

  let child: Deno.ChildProcess;
  try {
    child = new Deno.Command(input.cmd, {
      args: [...input.args],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
  } catch (error) {
    return failedToStartOutput(error, emptyStreams());
  }

  const stdout = readBounded(child.stdout, input.maxStdoutBytes);
  const stderr = readBounded(child.stderr, input.maxStderrBytes);
  const streams = async (): Promise<CapturedStreams> => ({
    stdout: await stdout,
    stderr: await stderr,
  });
  const status = child.status.then(
    (status): StatusResult => ({ ok: true, status }),
    (error): StatusResult => ({ ok: false, error }),
  );
  const statusTrigger = status.then((result): TerminalTrigger => ({ kind: 'status', result }));
  const timeoutTrigger = timeout(input.timeoutMs, { kind: 'timeout' });
  const abortTrigger = input.signal ? abort(input.signal) : undefined;

  let trigger: TerminalTrigger;
  try {
    trigger = await Promise.race([
      statusTrigger,
      timeoutTrigger.promise,
      ...(abortTrigger ? [abortTrigger.promise] : []),
    ]);
  } finally {
    timeoutTrigger.cancel();
    abortTrigger?.cancel();
  }

  if (trigger.kind === 'status') {
    const output = await streams();
    return trigger.result.ok
      ? exitedOutput(trigger.result.status, output)
      : failedToStartOutput(trigger.result.error, output);
  }

  const stoppedStatus = await terminate(child, status);
  const output = await streams();
  return stoppedOutput(
    stoppedStatus?.code ?? -1,
    output,
    trigger.kind === 'timeout' ? 'timedOut' : 'cancelled',
  );
}

function commandCaps(label: string, policy: OcrPolicy) {
  return {
    maxStdoutBytes: label === 'tesseract' ? policy.pdf.maxChars : COMMAND_STDOUT_BYTES,
    maxStderrBytes: COMMAND_STDERR_BYTES,
  };
}

async function readBounded(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<CapturedStream> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  try {
    while (true) {
      const res = await reader.read();
      if (res.done) break;

      const chunk = res.value;
      if (total < maxBytes) {
        const remaining = maxBytes - total;
        if (chunk.length <= remaining) {
          chunks.push(chunk);
          total += chunk.length;
        } else {
          chunks.push(chunk.slice(0, remaining));
          total = maxBytes;
          truncated = true;
        }
      } else if (chunk.length > 0) {
        truncated = true;
      }
    }
  } catch {
    // Keep already captured bytes. Termination can race stream closure.
  } finally {
    reader.releaseLock();
  }

  return { data: concat(chunks, total), truncated };
}

function concat(chunks: readonly Uint8Array[], total: number) {
  if (total === 0) return new Uint8Array();
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

async function terminate(
  child: Deno.ChildProcess,
  status: Promise<StatusResult>,
): Promise<Deno.CommandStatus | undefined> {
  kill(child, 'SIGTERM');
  const grace = statusWithin(status, COMMAND_KILL_GRACE_MS);
  const afterTerm = await grace.promise;
  grace.cancel();
  if (afterTerm?.ok) return afterTerm.status;

  kill(child, 'SIGKILL');
  const final = await status;
  return final.ok ? final.status : undefined;
}

function statusWithin(
  status: Promise<StatusResult>,
  timeoutMs: number,
): CancellablePromise<StatusResult | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), timeoutMs);
  });

  return {
    promise: Promise.race([status, expired]),
    cancel() {
      if (timer) clearTimeout(timer);
    },
  };
}

function timeout(ms: number, trigger: TerminalTrigger): CancellablePromise<TerminalTrigger> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    promise: new Promise<TerminalTrigger>((resolve) => {
      timer = setTimeout(() => resolve(trigger), ms);
    }),
    cancel() {
      if (timer) clearTimeout(timer);
    },
  };
}

function abort(signal: AbortSignal): CancellablePromise<TerminalTrigger> {
  let fired = false;
  let cleanup: (() => void) | undefined;

  return {
    promise: new Promise<TerminalTrigger>((resolve) => {
      const onAbort = () => {
        if (fired) return;
        fired = true;
        resolve({ kind: 'cancelled' });
      };
      cleanup = () => signal.removeEventListener('abort', onAbort);

      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }),
    cancel() {
      cleanup?.();
    },
  };
}

function kill(child: Deno.ChildProcess, signal: Deno.Signal) {
  try {
    child.kill(signal);
  } catch {
    // The process may already have exited.
  }
}

function exitedOutput(status: Deno.CommandStatus, streams: CapturedStreams): CommandOutput {
  return baseOutput(status.code, streams);
}

function failedToStartOutput(error: unknown, streams: CapturedStreams): CommandOutput {
  return {
    ...baseOutput(-1, streams),
    stderr: toErrorMessage(error),
    failedToStart: true,
  };
}

function stoppedOutput(
  code: number,
  streams: CapturedStreams,
  flag: 'cancelled' | 'timedOut',
): CommandOutput {
  const output = baseOutput(code, streams);
  const base = {
    ...output,
    stderr: output.stderr || (flag === 'cancelled' ? 'command cancelled' : 'command timed out'),
  };
  return flag === 'cancelled' ? { ...base, cancelled: true } : { ...base, timedOut: true };
}

function baseOutput(code: number, streams: CapturedStreams): CommandOutput {
  const decoder = new TextDecoder();
  return {
    code,
    stdout: decoder.decode(streams.stdout.data),
    stderr: decoder.decode(streams.stderr.data),
    stdoutTruncated: streams.stdout.truncated,
    stderrTruncated: streams.stderr.truncated,
  };
}

function emptyStreams(): CapturedStreams {
  return {
    stdout: { data: new Uint8Array(), truncated: false },
    stderr: { data: new Uint8Array(), truncated: false },
  };
}
