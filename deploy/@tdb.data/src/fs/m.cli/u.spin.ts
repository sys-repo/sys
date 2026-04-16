import { Cli, type t } from './common.ts';
import { Fmt } from './u.fmt.ts';

export async function withStageSpinner<T>(
  run: (onProgress: (info: t.SlcDataPipeline.StageSlugDataset.Progress) => void) => Promise<T>,
): Promise<T> {
  const label = Fmt.spinnerText('staging profile...');
  return Cli.Spinner.with(
    label,
    (spinner) => run((info) => void (spinner.text = Fmt.slugDatasetProgress(info))),
  );
}
