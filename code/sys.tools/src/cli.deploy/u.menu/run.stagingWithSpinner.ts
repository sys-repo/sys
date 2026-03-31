import { type t, pkg, c, Cli, Err, Path, Pkg, Str, Time } from '../common.ts';
import { shouldExclude } from '../u.exclude.ts';
import { executeStaging, finalizeDistTree, stagingConcurrencyDefault } from '../u.staging/mod.ts';
import { Fmt } from '../u.fmt.ts';

type RunStagingResult = { readonly ok: true } | { readonly ok: false; readonly error: unknown };

/**
 * Run executeStaging with a stable spinner UI.
 * Never throws unless you choose to rethrow based on ok:false.
 */
export async function runStagingWithSpinner(args: {
  cwd: t.StringDir;
  mappings: t.Ary<t.DeployTool.Staging.Mapping>;
  stagingRoot: t.StringRelativeDir;
  sourceRoot?: string;
  clear?: boolean;
  indexBaseDomain?: string;
  buildResetHtml?: boolean;
}): Promise<RunStagingResult> {
  const { cwd, mappings } = args;

  const spin = Cli.spinner();
  const started = Time.now.timestamp;
  spin.start(Fmt.spinnerText('Running staging...'));

  const active = new Map<number, string>();
  const total = mappings.length;
  let done = 0;
  let lastFail: t.DeployTool.Staging.ProgressEvent | undefined;

  const render = (): string => {
    const names = [...active.entries()].sort((a, b) => a[0] - b[0]).map(([, name]) => name);
    const lines: string[] = [];
    const progress = Math.min(total, done + active.size);
    const elapsed = Time.elapsed(started);
    const elapsedText = elapsed.msec >= 1000 ? ` ${c.gray(c.dim(elapsed.toString()))}` : '';
    lines.push(`staging (${c.white(String(progress))}/${total})...${elapsedText}`);

    for (const name of names) {
      lines.push(c.gray(`  - ${c.white(name)}`));
    }

    return lines.join('\n');
  };

  const refresh = () => {
    spin.text = Fmt.spinnerText(render());
  };
  const timer = globalThis.setInterval(refresh, 1000);

  try {
    try {
      await executeStaging({
        cwd,
        mappings,
        stagingRoot: args.stagingRoot,
        sourceRoot: args.sourceRoot,
        indexBaseDomain: args.indexBaseDomain,
        buildResetHtml: args.buildResetHtml,
        concurrency: stagingConcurrencyDefault({ total }),
        cleanStagingRoot: args.clear ?? false,
        writeDistJson: true,

        async onWriteDistJson(e) {
          // Regenerate dist metadata for the entire staging tree.
          await finalizeDistTree({
            dir: e.stagingRoot,
            pkg,
            builder: pkg,
            baseDomain: args.indexBaseDomain,
            filter: (path) => !shouldExclude(Path.basename(path)),
          });
        },

        onProgress(e) {
          if (e.kind === 'mapping:start') {
            active.set(e.index, Path.basename(e.source));
            refresh();
            return;
          }

          if (e.kind === 'mapping:done') {
            done += 1;
            active.delete(e.index);
            refresh();
            return;
          }

          if (e.kind === 'mapping:fail') {
            lastFail = e;
            active.delete(e.index);
            refresh();
            return;
          }

          refresh();
        },
      });
    } finally {
      globalThis.clearInterval(timer);
    }

    const stageAbs = Path.resolve(cwd, args.stagingRoot);
    const dist = (await Pkg.Dist.load(stageAbs)).dist;
    const hash = String(dist?.hash?.digest ?? '').trim();
    const suffix = hash ? Fmt.hashSuffix(hash) : '';
    const status = `${c.green('staging complete')}${suffix ? ` → ${suffix}` : ''}`;
    spin.succeed(Fmt.spinnerText(status));
    return { ok: true };
  } catch (error) {
    spin.fail(Fmt.spinnerText('Staging failed'));
    const detail = Err.summary(error, { cause: true, stack: false });
    const b = Str.builder()
      .line(c.red('Staging error details'))
      .line(c.gray(c.dim(`error: ${detail}`)));

    if (lastFail) {
      b.line(c.gray(c.dim(`mode: ${String(lastFail.mode)}`)));
      b.line(c.gray(c.dim(`source: ${String(lastFail.source)}`)));
      b.line(c.gray(c.dim(`staging: ${String(lastFail.staging)}`)));
    }

    console.info(String(b));
    return { ok: false, error };
  }
}
