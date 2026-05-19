import { Cmd, type t } from './common.ts';
import { readJson } from './u.http.ts';
import { cmdError } from './u.ts';

/** Read and validate an HTTP Cmd JSON result response. */
export async function readResponse(
  response: Response,
  expected: t.Cmd.Error.Meta,
): Promise<t.Cmd.Wire.Result> {
  let data: unknown;

  const throwError = (msg: string): never => {
    throw cmdError('CmdError.Remote', msg, expected);
  };

  const parsed = await readJson(response);
  if (parsed.ok) data = parsed.data;
  else throwError(`HTTP Cmd response was not JSON: ${parsed.error.message}`);

  if (!Cmd.Is.response(data)) return throwError('HTTP Cmd response was not a Cmd result.');
  if (data.id !== expected.id) throwError('HTTP Cmd response id mismatch.');
  if (data.name !== expected.name) throwError('HTTP Cmd response name mismatch.');
  if (data.ns !== expected.ns) throwError('HTTP Cmd response namespace mismatch.');

  return data;
}
