import { Path, type t } from '../common.ts';
import { stagingPathIssue } from '../u.endpoints/u.pathPolicy.ts';

/** Resolve and validate the dedicated endpoint staging root. */
export function resolveStagingRoot(args: {
  cwd: t.StringDir;
  stagingRootRel: string;
}): t.StringDir {
  const cwd = Path.resolve(args.cwd, '.');
  const input = String(args.stagingRootRel ?? '');
  const issue = stagingPathIssue(input, { allowRoot: false });

  if (issue === 'required') throw invalidRoot('a non-empty relative descendant is required');
  if (issue === 'edge-whitespace') {
    throw invalidRoot('leading or trailing whitespace is not allowed');
  }
  if (issue === 'tilde') throw invalidRoot('tilde paths are not allowed');
  if (issue === 'absolute') throw invalidRoot('absolute paths are not allowed');
  if (issue === 'backslash') throw invalidRoot('backslash paths are not portable');
  if (issue === 'parent') throw invalidRoot('parent traversal is not allowed');
  if (issue === 'root') {
    throw invalidRoot('the deploy working directory cannot be the staging root');
  }
  if (issue === 'non-canonical') {
    throw invalidRoot('canonical relative path segments are required');
  }
  if (issue === 'non-portable') throw invalidRoot('a path segment is not portable');

  const resolved = Path.resolve(cwd, input);
  const relativeHost = Path.relative(cwd, resolved);
  if (Path.Is.absolute(relativeHost) || !Path.Is.within(cwd, resolved)) {
    throw invalidRoot('the root must stay beneath the deploy cwd');
  }

  const relative = Path.relativePosix(relativeHost);
  if (!relative || relative === '.' || relative === '..' || relative.startsWith('../')) {
    throw invalidRoot('the deploy working directory cannot be the staging root');
  }
  return resolved;
}

function invalidRoot(reason: string): Error {
  return new Error(`Deploy staging root is invalid: ${reason}.`);
}
