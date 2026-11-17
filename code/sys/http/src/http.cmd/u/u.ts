import { slug, type t } from '../common.ts';

/** Construct a bounded diagnostic using only owner-selected facts. */
export function failure(
  kind: t.HttpCmd.FailureKind,
  dispatch: t.HttpCmd.Error['dispatch'] = 'not-dispatched',
  status?: number,
): t.HttpCmd.Error {
  const error = new Error(`HTTP command failed: ${kind}.`);
  delete error.stack;
  Object.defineProperties(error, {
    name: { value: 'HttpCmdError', enumerable: true },
    kind: { value: kind, enumerable: true },
    dispatch: { value: dispatch, enumerable: true },
    ...(status === undefined ? {} : { status: { value: status, enumerable: true } }),
  });
  return Object.freeze(error) as t.HttpCmd.Error;
}

/** Create a canonical request correlation id, never public failure metadata. */
export function createId(): t.Cmd.ReqId {
  return `req-${slug()}`;
}
