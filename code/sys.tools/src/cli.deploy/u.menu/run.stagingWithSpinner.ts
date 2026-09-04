import { c, Cli, Err, Path, Str, type t, Time } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { type StagePlan, stagePlan } from '../u.stage.ts';

type RunStagingResult = { readonly ok: true } | { readonly ok: false; readonly error: unknown };

/**
 * Run endpoint staging with a stable spinner UI.
 * Never throws unless you choose to rethrow based on ok:false.
 */
export async function runStagingWithSpinner(
  plan: Extract<StagePlan, { kind: 'mappings' }>,
): Promise<RunStagingResult> {
  const { mappings } = plan.stage;

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
    const elapsedValue = elapsed.msec >= 60_000
      ? elapsed.format({ unit: 'm', round: 1 })
      : elapsed.toString();
    const elapsedText = elapsed.msec >= 1000 ? ` ${c.gray(c.dim(elapsedValue))}` : '';
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
      const staged = await stagePlan(plan, {
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
      if (!staged.ok) throw (staged.error ?? new Error('Staging failed'));
      const hash = String(staged.verification.dist.hash.digest).trim();
      const suffix = hash ? Fmt.hashSuffix(hash) : '';
      const status = `${c.green('staging complete')}${suffix ? ` → ${suffix}` : ''}`;
      spin.succeed(Fmt.spinnerText(status));
      return { ok: true };
    } finally {
      globalThis.clearInterval(timer);
    }
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
