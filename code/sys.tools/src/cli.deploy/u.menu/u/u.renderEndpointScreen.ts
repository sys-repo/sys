import { Str, type t } from './common.ts';
import { Fmt } from '../../u.fmt.ts';

/** Render the endpoint screen with optional validation or preview refusal. */
export function renderEndpointScreen(args: {
  table: string;
  check: t.DeployTool.Endpoint.Fs.YamlCheck;
  previewReason?: t.Pkg.Dist.Local.Verify.FailureKind;
}): string {
  const { table, check, previewReason } = args;
  const b = Str.builder().blank().line(table);

  if (!check.ok) {
    const validation = Fmt.endpointValidation(check);
    b.blank().line(validation);
  } else if (previewReason) {
    b.blank().line(Fmt.previewUnavailable(previewReason));
  }

  b.blank();
  return String(b);
}
