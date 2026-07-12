import { Fs, Is, Obj, type t } from '../common.ts';
import type { PackageCommand } from '../u/u.worker.ts';
import { classifyNativeTestTask, type NativeTestTaskClassification } from './u.classify.ts';
import { nativeTestStatsUnavailable, readNativeTestStatsReport } from './u.junit.ts';

export type NativeTestStatsRun = {
  /** Temporary report directory when artifact collection is active. */
  readonly dir?: t.StringDir;
  /** Prepare one package command for native stats collection. */
  readonly prepare: (args: PrepareNativeTestStatsArgs) => PreparedNativeTestStats;
  /** Remove run-scoped report artifacts. Telemetry cleanup never throws. */
  readonly cleanup: () => Promise<void>;
};

export type PrepareNativeTestStatsArgs = {
  readonly task: t.WorkspaceRun.Task;
  readonly packagePath: t.StringPath;
  readonly deno: Record<string, unknown>;
  readonly command: PackageCommand;
};

export type PreparedNativeTestStats = {
  readonly command: PackageCommand;
  readonly collect: () => Promise<t.WorkspaceRun.Test.Stats.Result>;
};

/** Create a run-scoped native test stats collector backed by temporary JUnit reports. */
export async function createNativeTestStatsRun(): Promise<NativeTestStatsRun> {
  const names = new Map<string, number>();
  let dir: t.StringDir | undefined;
  let tempError: string | undefined;
  let cleaned = false;

  try {
    dir = (await Fs.makeTempDir({ prefix: 'sys-workspace-test-stats-' })).absolute as t.StringDir;
  } catch (error) {
    tempError = wrangle.errorMessage(error);
  }

  return {
    dir,
    prepare(args) {
      return wrangle.prepare({ ...args, dir, tempError, names });
    },
    async cleanup() {
      if (cleaned) return;
      cleaned = true;
      if (!dir) return;
      try {
        await Fs.remove(dir);
      } catch {
        /* Telemetry cleanup must not fail an otherwise valid workspace run. */
      }
    },
  };
}

/**
 * Helpers:
 */
const wrangle = {
  prepare(
    args: PrepareNativeTestStatsArgs & {
      readonly dir?: t.StringDir;
      readonly tempError?: string;
      readonly names: Map<string, number>;
    },
  ): PreparedNativeTestStats {
    const script = wrangle.taskScript(args.deno, args.task);
    const classification = classifyNativeTestTask(script ?? '');

    if (classification.kind === 'unsupported') {
      return wrangle.prepared(args.command, wrangle.unsupportedStats(classification));
    }

    if (!wrangle.isDenoTaskCommand(args.command, args.task)) {
      return wrangle.prepared(
        args.command,
        wrangle.unsupportedStats({
          kind: 'unsupported',
          command: script ?? '',
          reason: 'command:not-deno-task',
          tokens: classification.tokens,
        }),
      );
    }

    if (!args.dir) {
      return wrangle.prepared(
        args.command,
        nativeTestStatsUnavailable('temp:create-failed', args.tempError),
      );
    }

    const reportPath = Fs.join(args.dir, wrangle.reportFilename(args.packagePath, args.names));
    return {
      command: {
        cmd: args.command.cmd,
        args: [...args.command.args, '--junit-path', reportPath],
      },
      collect: () => readNativeTestStatsReport(reportPath),
    };
  },

  prepared(
    command: PackageCommand,
    stats: t.WorkspaceRun.Test.Stats.Result,
  ): PreparedNativeTestStats {
    return { command, collect: () => Promise.resolve(stats) };
  },

  taskScript(deno: Record<string, unknown>, task: t.WorkspaceRun.Task) {
    const tasks = deno.tasks;
    if (!Obj.isRecord(tasks)) return undefined;
    const value = tasks[task];
    return Is.str(value) ? value : undefined;
  },

  isDenoTaskCommand(command: PackageCommand, task: t.WorkspaceRun.Task) {
    return command.cmd === 'deno' && command.args[0] === 'task' && command.args[1] === task;
  },

  unsupportedStats(
    classification: Extract<NativeTestTaskClassification, { readonly kind: 'unsupported' }>,
  ): t.WorkspaceRun.Test.Stats.Unsupported {
    return {
      kind: 'unsupported',
      capability: 'none',
      reason: classification.reason,
      command: classification.command,
    };
  },

  reportFilename(path: t.StringPath, names: Map<string, number>) {
    const stem = path
      .split(/[\\/]+/)
      .filter(Boolean)
      .join('__')
      .replace(/[^A-Za-z0-9._-]/g, '_') || 'package';
    const next = (names.get(stem) ?? 0) + 1;
    names.set(stem, next);
    return `${stem}${next > 1 ? `-${next}` : ''}.junit.xml`;
  },

  errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  },
} as const;
