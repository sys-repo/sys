import { c, Cli, Err, Str, type t } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { type StagePlan, stagePlan } from '../u.stage.ts';

type RunDenoStagingResult =
  | { readonly ok: true; readonly stagingRoot: t.StringDir }
  | { readonly ok: false; readonly error: unknown };

/** Run Deno endpoint staging with CLI presentation side-effects. */
export async function runDenoStagingWithSpinner(
  plan: Extract<StagePlan, { readonly kind: 'deno' }>,
): Promise<RunDenoStagingResult> {
  const spin = Cli.spinner();
  spin.start(Fmt.spinnerText('Running Deno staging...'));

  const res = await stagePlan(plan);
  if (res.ok) {
    const text = `${c.green('deno staging complete')} → ${c.white(res.stagingRoot)}`;
    spin.succeed(Fmt.spinnerText(text));
    return res;
  }

  const error = res.error ?? new Error('Deno staging failed');
  spin.fail(Fmt.spinnerText('Deno staging failed'));
  const detail = Err.summary(error, { cause: true, stack: false });
  const body = Str.builder()
    .line(c.red('Deno staging error details'))
    .line(c.gray(c.dim(`error: ${detail}`)));
  console.info(String(body));
  return { ok: false, error };
}
