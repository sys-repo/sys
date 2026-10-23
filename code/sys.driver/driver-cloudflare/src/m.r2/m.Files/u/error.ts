import { Cmd, Err, Is, type t } from '../common.ts';
import { exposeDiagnostic, R2Error } from '../../u/u.diagnostic.ts';

/** Create a named Files/R2 backing error. */
export function fail(kind: t.R2.Files.Error.Kind, message: string, cause?: unknown): Error {
  return Err.std(message, { name: kind, ...(cause === undefined ? {} : { cause }) });
}

/** Normalize a provider/substrate operation into the Files/R2 error domain. */
export async function provider<T>(args: {
  readonly action: string;
  readonly path?: t.Files.String.Path;
  readonly run: () => Promise<T>;
}): Promise<T> {
  try {
    return await args.run();
  } catch (cause) {
    if (isFilesR2Error(cause)) {
      // Absence is a Files outcome, not a generic provider failure or a message to parse.
      if (cause.name === 'FilesR2Error.NotFound') {
        throw Cmd.Error.expose({ name: cause.name, message: cause.message });
      }
      throw cause;
    }
    const detail = R2Error.diagnostic(cause);
    if (detail) throw exposeDiagnostic(detail);
    if (Is.record(cause) && (cause.name === 'NotCapable' || cause.name === 'PermissionDenied')) {
      throw Cmd.Error.expose({
        name: cause.name,
        message: `R2 ${args.action} blocked by runtime permissions.`,
      });
    }
    const suffix = args.path === undefined ? '' : `: ${args.path}`;
    throw fail('FilesR2Error.Unsupported', `${args.action} failed${suffix}`, cause);
  }
}

/** True when an error is already in the Files/R2 backing domain. */
export function isFilesR2Error(error: unknown): error is Error {
  return (Is.error(error) || Err.Is.stdError(error)) && error.name.startsWith('FilesR2Error.');
}

/** Files/R2 invalid path error factory. */
export function invalidPath(message: string): Error {
  return fail('FilesR2Error.InvalidPath', message);
}
