import { Cmd, type t } from '../common.ts';
import { decodeJson } from './u.http.ts';

/** Decode and correlate one already bounded terminal response. */
export function readResponse(
  bytes: Uint8Array<ArrayBuffer>,
  expected: t.Cmd.Wire.Request,
): t.Cmd.Wire.Result {
  const data = decodeJson(bytes);
  if (
    !Cmd.Is.response(data) || data.id !== expected.id || data.name !== expected.name ||
    data.ns !== expected.ns
  ) throw new Error('Invalid command result.');
  return data;
}
