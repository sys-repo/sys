import { type t, Obj } from './common.ts';

export function toBundleSequenceResult(args: {
  dir: t.BundleSequenceResult['dir'];
  issues: readonly t.SlugBundleTransform.Issue[];
}): t.BundleSequenceResult {
  const issues = args.issues.map((issue) => toLintIssue(issue));
  return Obj.asGetter({ dir: args.dir, issues }, ['issues']);
}

function toLintIssue(issue: t.SlugBundleTransform.Issue): t.LintSequenceFilepath {
  return {
    kind: issue.kind as t.LintSequenceFilepathKind,
    severity: issue.severity,
    message: issue.message,
    path: issue.path ?? '',
    raw: issue.raw ?? '',
    resolvedPath: issue.resolvedPath ?? '',
    ...(issue.doc?.id ? { doc: { id: issue.doc.id as t.Crdt.Id } } : {}),
  } as t.LintSequenceFilepath;
}
