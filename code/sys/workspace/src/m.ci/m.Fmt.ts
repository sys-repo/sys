import { Cli, Str, type t } from './common.ts';

/** Commit-summary formatters for workspace CI close-out output. */
export const Fmt: t.WorkspaceCi.Fmt.Lib = Object.freeze({
  finalCommitMessage,
  finalCommitSuggestion,
});

/**
 * Helpers:
 */
function finalCommitMessage(args: t.WorkspaceCi.Fmt.FinalCommitMessageArgs) {
  const packages = `${args.refreshedWorkspacePackageCount} workspace ${
    Str.plural(args.refreshedWorkspacePackageCount, 'package')
  }`;
  const modules = `${args.jsrPublishModuleCount} jsr:publish ${
    Str.plural(args.jsrPublishModuleCount, 'module')
  }`;
  return `chore(workspace): refreshed ${packages} (${modules})`;
}

function finalCommitSuggestion(args: t.WorkspaceCi.Fmt.FinalCommitMessageArgs) {
  return Cli.Fmt.Commit.suggestion(finalCommitMessage(args), {
    title: { text: 'final commit msg:', color: 'cyan', bold: false },
    message: { color: 'white' },
  });
}
