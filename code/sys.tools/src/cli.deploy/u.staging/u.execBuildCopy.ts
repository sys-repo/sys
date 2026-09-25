import { Fs, Is, Process, Str, type t } from '../common.ts';
import { copyInto } from './u.copyInto.ts';
import { throwIfStagingCancelled } from './u.cancel.ts';
import { assertDirectoryIdentity, captureDirectoryIdentity } from './u.identity.ts';
import type { StagingManifestLedger } from './u.manifest.ts';
import type { ExecutableStagingDir } from './u.prepare.ts';

type Task = 'test' | 'build';

type ExecutionContext = {
  sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
  destinationIdentity: t.DeployTool.Staging.DirectoryIdentity;
  manifestLedger: StagingManifestLedger;
  signal?: AbortSignal;
};

const OUTPUT_BYTES = 64 * 1024;
const EXECUTION_TIMEOUT: t.Msecs = 30 * 60 * 1_000;
const TERMINATION_GRACE: t.Msecs = 1_000;

/** Build one retained source directory, then copy its admitted `/dist` output. */
export async function execBuildCopy(
  dir: ExecutableStagingDir,
  context: ExecutionContext,
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
): Promise<void> {
  const srcDist = Fs.join(dir.source, 'dist');
  const reportStep = (label: string) => report?.({ kind: 'mapping:step', label });

  reportStep('test');
  await assertProjectIdentities(context);
  await runTask({ source: dir.source, task: 'test', signal: context.signal });
  await assertProjectIdentities(context);

  reportStep('build');
  await assertProjectIdentities(context);
  await runTask({ source: dir.source, task: 'build', signal: context.signal });
  await assertProjectIdentities(context);

  const distIdentity = await captureDirectoryIdentity({
    path: srcDist,
    label: 'Deploy staging build output',
    signal: context.signal,
  });
  reportStep('copy');
  await assertProjectIdentities(context);
  await assertDirectoryIdentity(distIdentity, 'Deploy staging build output', context.signal);
  await copyInto({
    src: srcDist,
    dst: dir.staging,
    sourceIdentity: distIdentity,
    destinationIdentity: context.destinationIdentity,
    manifestLedger: context.manifestLedger,
    signal: context.signal,
  });
  await assertProjectIdentities(context);
}

async function runTask(args: {
  source: t.StringDir;
  task: Task;
  signal?: AbortSignal;
}): Promise<void> {
  throwIfStagingCancelled(args.signal);
  const command = `deno -q task ${args.task}`;
  let result: t.Process.CaptureOutput;
  try {
    result = await Process.capture({
      args: ['-q', 'task', args.task],
      cwd: args.source,
      signal: args.signal,
      executionTimeout: EXECUTION_TIMEOUT,
      maxStdoutBytes: OUTPUT_BYTES,
      maxStderrBytes: OUTPUT_BYTES,
      terminationGrace: TERMINATION_GRACE,
    });
  } catch (cause) {
    throw new Error(`Failed to execute ${args.task} task: ${args.source}\ncommand: ${command}`, {
      cause,
    });
  }

  if (result.outcome === 'cancelled') {
    throw new Error(`Cancelled ${args.task} task: ${args.source}\ncommand: ${command}`, {
      cause: args.signal?.reason,
    });
  }
  if (result.outcome === 'failed-to-start') {
    throw new Error(`Failed to start ${args.task} task: ${args.source}\ncommand: ${command}`, {
      cause: result.error,
    });
  }
  if (result.outcome === 'failed') {
    throw new Error(captureFailureMessage(args.source, args.task, command, result), {
      cause: result.error,
    });
  }
  if (result.outcome === 'timed-out') {
    throw new Error(`Timed out ${args.task} task: ${args.source}\ncommand: ${command}`);
  }
  if (result.success) return;

  const output = capturedOutput(result);
  const signal = result.signal ? `, signal ${result.signal}` : '';
  const message = Str.builder()
    .line(`Failed ${args.task} task: ${args.source} (exit ${result.code}${signal})`)
    .line(`command: ${command}`)
    .line(output)
    .toString();
  throw new Error(message);
}

function captureFailureMessage(
  source: t.StringDir,
  task: Task,
  command: string,
  result: t.Process.CaptureFailedOutput,
): string {
  return Str.builder()
    .line(`Failed ${task} task execution or cleanup: ${source}`)
    .line(`command: ${command}`)
    .line(capturedOutput(result))
    .toString();
}

function capturedOutput(result: t.Process.CaptureOutput): string {
  return [
    outputSection('stdout', result.text.stdout, result.stdoutTruncated),
    outputSection('stderr', result.text.stderr, result.stderrTruncated),
  ].filter(Is.string).join('\n\n');
}

function outputSection(stream: 'stdout' | 'stderr', value: string, truncated: boolean) {
  const text = Str.trimEdgeNewlines(value);
  if (!text && !truncated) return;
  const suffix = truncated ? '\n… output truncated …' : '';
  return `${stream}:\n${text}${suffix}`;
}

async function assertProjectIdentities(context: ExecutionContext): Promise<void> {
  throwIfStagingCancelled(context.signal);
  await assertDirectoryIdentity(
    context.sourceIdentity,
    'Deploy staging mapping source',
    context.signal,
  );
  await assertDirectoryIdentity(
    context.destinationIdentity,
    'Deploy staging mapping destination',
    context.signal,
  );
}
