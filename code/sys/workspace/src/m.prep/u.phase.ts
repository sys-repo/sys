import { type t, c, Cli, Time } from './common.ts';

export async function runPhase<T>(args: {
  readonly spinner: t.CliSpinner.Instance;
  readonly label: string;
  readonly silent: boolean;
  readonly fn: () => Promise<T>;
  readonly done?: (result: T, startedAt: number) => Promise<string> | string;
  readonly fail?: (error: Error) => string;
}) {
  if (args.silent) return await args.fn();
  const startedAt = Time.now.timestamp;
  const timer = Time.interval(1000, () => (args.spinner.text = phaseText(args.label, startedAt)));
  args.spinner.start(Cli.Fmt.spinnerText(args.label));
  try {
    const res = await args.fn();
    timer.cancel();
    args.spinner.stop();
    if (args.done) {
      console.info(await args.done(res, startedAt));
    } else {
      console.info();
    }
    return res;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    timer.cancel();
    if (args.fail) {
      args.spinner.fail(Cli.Fmt.spinnerText(args.fail(err)));
    } else {
      args.spinner.stop();
      console.info();
    }
    throw err;
  }
}

function phaseText(label: string, startedAt: number) {
  const elapsed = c.dim(c.gray(` ${String(Time.elapsed(startedAt))}`));
  return Cli.Fmt.spinnerText(`${label}${elapsed}`);
}
