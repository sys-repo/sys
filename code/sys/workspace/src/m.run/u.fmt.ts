import { Cli, Str, Time, c, type t } from './common.ts';

export const Fmt: t.WorkspaceRun.Fmt.Lib = {
  result(result) {
    const rows = Cli.table([]);
    const counts = wrangle.counts(result.packages);
    const noun = wrangle.taskNoun(result.task);
    const status = result.ok ? c.green('success') : c.red('failed');
    const color = result.ok ? 'green' : 'red';
    const title = result.ok
      ? c.green(`Workspace ${noun} done in ${Time.duration(result.elapsed).toString()}`)
      : c.red(`Workspace ${noun} failed in ${Time.duration(result.elapsed).toString()}`);

    rows.push([c.gray('status'), status]);
    rows.push([c.gray('task'), c.white(result.task)]);
    rows.push([c.gray('ran'), counts.ran > 0 ? c.white(String(counts.ran)) : c.gray('0')]);
    rows.push([c.gray('skipped'), counts.skipped > 0 ? c.yellow(String(counts.skipped)) : c.gray('0')]);
    rows.push([c.gray('failed'), counts.failed > 0 ? c.red(String(counts.failed)) : c.gray('0')]);

    const str = Str.builder();
    str.line(title);
    str.line(Cli.Fmt.hr(color));
    str.line(
      String(rows)
        .split('\n')
        .map((line) => (line.trim() ? ` ${line}` : line))
        .join('\n'),
    );

    const packages = Fmt.packages(result);
    if (packages) str.blank().line(packages);

    return Str.trimEdgeNewlines(String(str));
  },

  packages(result) {
    const rows = Cli.table([]);
    rows.push([c.gray('package'), c.gray('status'), c.gray('elapsed')]);

    for (const item of result.packages) {
      if (item.kind === 'skipped') {
        rows.push([c.gray(item.path), c.yellow('skipped'), c.gray('—')]);
        continue;
      }

      rows.push([
        c.white(item.path),
        item.success ? c.green('ok') : c.red('failed'),
        c.white(Time.duration(item.elapsed).toString()),
      ]);
    }

    return Str.trimEdgeNewlines(String(rows));
  },
};

const wrangle = {
  counts(packages: readonly t.WorkspaceRun.Package.Result[]) {
    return packages.reduce(
      (acc, item) => {
        if (item.kind === 'skipped') return { ...acc, skipped: acc.skipped + 1 };
        return item.success
          ? { ...acc, ran: acc.ran + 1 }
          : { ...acc, ran: acc.ran + 1, failed: acc.failed + 1 };
      },
      { ran: 0, skipped: 0, failed: 0 },
    );
  },

  taskNoun(task: t.WorkspaceRun.Task) {
    if (task === 'test') return 'tests';
    return 'checks';
  },
} as const;
