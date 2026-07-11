import { c, Str, Time, type t } from '../common.ts';

const DEFAULT_DELAY = 2_000 as t.Msecs;
const DEFAULT_CONTEXT_LIMIT = 3;

/** Warn when a completed workspace run leaves the parent process alive. */
export const CompletionHang: t.CompletionHang.Lib = {
  armWarning(input) {
    const delay = input.delay ?? DEFAULT_DELAY;
    const deps = input.deps ?? wrangle.defaultDeps();
    const write = input.write ?? console.info;
    let active = true;
    const timer = deps.setTimeout(() => {
      if (!active) return;
      active = false;
      write(CompletionHang.formatWarning({ ...input, delay }));
    }, delay);
    deps.unrefTimer(timer);
    return {
      cancel() {
        if (!active) return;
        active = false;
        deps.clearTimeout(timer);
      },
    };
  },

  formatWarning(input) {
    const delay = input.delay ?? DEFAULT_DELAY;
    const body = wrangle.muted(
      `workspace ${input.result.task} completed, but the parent process appears to be hanging after ${wrangle.duration(delay)}`,
    );
    const details = wrangle.detailLines(input).join('\n');

    return Str.dedent(`${c.yellow('Warning')}
${body}

${details}`);
  },
};

/**
 * Helpers:
 */
const wrangle = {
  defaultDeps(): t.CompletionHang.Deps {
    return {
      setTimeout,
      clearTimeout,
      unrefTimer: (id) => Deno.unrefTimer(id),
    };
  },

  detailLines(input: t.CompletionHang.FormatInput) {
    const lines = [
      '- all package results completed',
      `- result: ${input.result.ok ? 'passed' : 'failed'}`,
      `- packages: ${input.result.packages.length} completed`,
      ...wrangle.strategyLines(input.strategy),
      '- note: remaining liveness is outside the completed package results',
      ...wrangle.contextLines(input),
    ];
    return lines.map(wrangle.muted);
  },

  muted: (text: string) => c.gray(c.italic(text)),

  strategyLines(strategy?: t.CompletionHang.StrategyContext) {
    if (!strategy) return [];
    if (strategy.kind === 'sequential') return ['- strategy: sequential'];
    return strategy.jobs === undefined
      ? ['- strategy: parallel']
      : [`- strategy: parallel, jobs ${strategy.jobs}`];
  },

  contextLines(input: t.CompletionHang.FormatInput) {
    const rows = wrangle.contextRows(input);
    if (rows.length === 0) return [];
    return ['- context:', ...rows.map((row) => `  - ${row}`)];
  },

  contextRows(input: t.CompletionHang.FormatInput) {
    const packages = wrangle.packageNames(input.packages ?? []);
    const limit = input.contextLimit ?? DEFAULT_CONTEXT_LIMIT;
    return input.result.packages
      .filter((item): item is t.WorkspaceRun.Package.Ran => item.kind === 'ran')
      .toSorted((a, b) => b.elapsed - a.elapsed)
      .slice(0, limit)
      .map((item) => wrangle.packageRow(item, packages));
  },

  packageNames(packages: readonly t.CompletionHang.PackageContext[]) {
    return new Map(packages.map((item) => [item.path, item.name] as const));
  },

  packageRow(item: t.WorkspaceRun.Package.Ran, packages: Map<t.StringPath, string | undefined>) {
    const name = packages.get(item.path);
    const elapsed = Time.duration(item.elapsed).toString();
    return name ? `${name} - ${item.path}, ${elapsed}` : `${item.path}, ${elapsed}`;
  },

  duration(delay: t.Msecs) {
    return Time.duration(delay).format('s');
  },
} as const;
