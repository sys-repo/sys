import { Cli, type t } from './common.ts';
import { Fmt } from './u.fmt.ts';

export async function withSpinner<T>(
  text: string,
  run: (api: { setText(text: string): void }) => Promise<T>,
): Promise<T> {
  const spinner = Cli.spinner();
  spinner.start();
  spinner.text = text;
  try {
    return await run({
      setText(text) {
        spinner.text = text;
      },
    });
  } finally {
    spinner.stop();
  }
}

export async function withStageSpinner<T>(
  run: (onProgress: (info: t.SlcDataPipeline.StageSlugDataset.Progress) => void) => Promise<T>,
): Promise<T> {
  return withSpinner(Fmt.spinnerText('staging profile...'), ({ setText }) =>
    run((info) => void setText(Fmt.slugDatasetProgress(info)))
  );
}
