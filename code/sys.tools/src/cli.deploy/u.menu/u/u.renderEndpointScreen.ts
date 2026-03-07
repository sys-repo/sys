import { type t, Str } from './common.ts';
import { Fmt } from '../../u.fmt.ts';

/**
 * Render the endpoint "screen" (table + optional validation block),
 * ready to print via console.info.
 */
export function renderEndpointScreen(args: {
  table: string;
  check: t.DeployTool.Endpoint.Fs.YamlCheck;
}): string {
  const { table, check } = args;
  const b = Str.builder().blank().line(table);

  if (!check.ok) {
    const validation = Fmt.endpointValidation(check);
    b.blank().line(validation);
  }

  b.blank();
  return String(b);
}
