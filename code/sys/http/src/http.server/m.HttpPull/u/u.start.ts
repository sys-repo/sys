import { HttpClient, type t } from '../common.ts';
import { createResourceOperation } from './u.resource.operation.ts';

type Start = t.HttpPull.Lib['start'];
type MakeClient = t.HttpFetch.Lib['make'];

/** Bind checksum-pinned operation ownership to the canonical Fetch factory. */
export function createStarter(makeClient: MakeClient = HttpClient.fetcher): Start {
  return (input) => createResourceOperation(makeClient, input as unknown);
}

/** Start one checksum-pinned bounded Pull operation. */
export const start = createStarter();
