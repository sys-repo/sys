import { Process } from '@sys/process/process';
import type { CommandInput, CommandOutput, CommandRunner, OcrPolicy } from './t.ts';
import { formatStderr, toErrorMessage } from './u.result.ts';

const COMMAND_STDOUT_BYTES = 64_000;
const COMMAND_STDERR_BYTES = 64_000;

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
  const output = await Process.capture({
    cmd: input.cmd,
    args: [...input.args],
    signal: input.signal,
    timeoutMs: input.timeoutMs,
    maxStdoutBytes: input.maxStdoutBytes,
    maxStderrBytes: input.maxStderrBytes,
  });

  if (output.outcome === 'timed-out') return stoppedOutput(output, 'timedOut');
  if (output.outcome === 'cancelled') return stoppedOutput(output, 'cancelled');
  if (output.outcome === 'failed-to-start') {
    return {
      code: -1,
      stdout: output.text.stdout,
      stderr: toErrorMessage(output.error),
      failedToStart: true,
      stdoutTruncated: output.stdoutTruncated,
      stderrTruncated: output.stderrTruncated,
    };
  }

  return {
    code: output.code,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
    stdoutTruncated: output.stdoutTruncated,
    stderrTruncated: output.stderrTruncated,
  };
}

function commandCaps(label: string, policy: OcrPolicy) {
  return {
    maxStdoutBytes: label === 'tesseract'
      ? policy.pdf.maxChars
      : COMMAND_STDOUT_BYTES,
    maxStderrBytes: COMMAND_STDERR_BYTES,
  };
}

function stoppedOutput(
  output: Awaited<ReturnType<typeof Process.capture>>,
  flag: 'cancelled' | 'timedOut',
): CommandOutput {
  return {
    code: output.code ?? -1,
    stdout: output.text.stdout,
    stderr: output.text.stderr ||
      (flag === 'cancelled' ? 'command cancelled' : 'command timed out'),
    [flag]: true,
    stdoutTruncated: output.stdoutTruncated,
    stderrTruncated: output.stderrTruncated,
  };
}
