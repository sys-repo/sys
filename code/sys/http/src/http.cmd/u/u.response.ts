import { Cmd, type t } from '../common.ts';
import { readJson } from './u.http.ts';
import { cmdError } from './u.ts';

/** Read and validate an HTTP Cmd JSON result response. */
export async function readResponse(
  response: Response,
  expected: t.Cmd.Error.Meta,
): Promise<t.Cmd.Wire.Result> {
  let data: unknown;

  const fail = (msg: string): never => {
    throw cmdError('CmdError.Remote', msg, expected);
  };

  const parsed = await readJson(response);
  if (parsed.ok) data = parsed.data;
  else fail(`HTTP Cmd response was not JSON: ${parsed.error.message}`);

  if (!Cmd.Is.response(data)) return fail('HTTP Cmd response was not a Cmd result.');
  if (data.id !== expected.id) fail('HTTP Cmd response id mismatch.');
  if (data.name !== expected.name) fail('HTTP Cmd response name mismatch.');
  if (data.ns !== expected.ns) fail('HTTP Cmd response namespace mismatch.');

  return data;
}
