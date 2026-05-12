import { c, Cli, Err, Str, type t } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { DenoProvider } from '../u.providers/mod.ts';

type RunDenoStagingResult =
  | { readonly ok: true; readonly stagingRoot: t.StringDir }
  | { readonly ok: false; readonly error: unknown };

/** Run Deno endpoint staging with CLI presentation side-effects. */
export async function runDenoStagingWithSpinner(args: {
  readonly cwd: t.StringDir;
  readonly yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<RunDenoStagingResult> {
  const spin = Cli.spinner();
  spin.start(Fmt.spinnerText('Running Deno staging...'));

  const res = await DenoProvider.stage(args);
  if (res.ok) {
    const text = `${c.green('deno staging complete')} → ${c.white(res.stagingRoot)}`;
    spin.succeed(Fmt.spinnerText(text));
    return res;
  }

  spin.fail(Fmt.spinnerText('Deno staging failed'));
  const detail = Err.summary(res.error, { cause: true, stack: false });
  const body = Str.builder()
    .line(c.red('Deno staging error details'))
    .line(c.gray(c.dim(`error: ${detail}`)));
  console.info(String(body));
  return res;
}
