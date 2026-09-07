import type { CopyParams, ExtensionApi, MoveParams, RemoveParams, SandboxFsPolicy } from './t.ts';
import { guardCopy, guardMove, guardRemove } from './u.guard.ts';
import { Fs } from './u.path.ts';
import {
  toCopyError,
  toCopyErrorMessage,
  toCopySuccess,
  toFsErrorMessage,
  toMoveError,
  toMoveErrorMessage,
  toMoveSuccess,
  toRemoveError,
  toRemoveSuccess,
} from './u.result.ts';
import { copyParameters, moveParameters, removeParameters } from './u.schema.ts';

export function registerRemove(pi: ExtensionApi, policy: SandboxFsPolicy) {
  pi.registerTool({
    name: 'remove',
    label: 'Remove',
    description:
      'Remove a file or directory path inside the writable sandbox. No globs, no shell commands.',
    promptSnippet: 'Remove a file or directory path inside the writable sandbox.',
    promptGuidelines: [
      'Use remove only for stale files or directories that should no longer exist after a refactor.',
      'Do not use bash for file deletion; use remove for cleanup inside the writable sandbox.',
      'Set recursive only when removing a directory tree and profile policy permits recursive removal.',
    ],
    parameters: removeParameters,

    async execute(_toolCallId, params: RemoveParams, _signal, _onUpdate, ctx) {
      const requested = params.path.trim();
      const recursive = params.recursive === true;
      const target = Fs.resolve(ctx.cwd, requested);
      const guard = await guardRemove({ requested, target, recursive, policy });

      if (!guard.ok) return toRemoveError(requested, target, recursive, guard.reason);

      try {
        await Fs.remove(target, { recursive });
        return toRemoveSuccess(requested, target, recursive);
      } catch (error) {
        return toRemoveError(
          requested,
          target,
          recursive,
          toFsErrorMessage('remove', target, error),
        );
      }
    },
  });
}

export function registerMove(pi: ExtensionApi, policy: SandboxFsPolicy) {
  pi.registerTool({
    name: 'move',
    label: 'Move',
    description:
      'Move or rename a file or directory path inside the writable sandbox. No globs, no shell commands.',
    promptSnippet: 'Move or rename a file or directory path inside the writable sandbox.',
    promptGuidelines: [
      'Use move for file/directory renames and refactor moves that should preserve content exactly.',
      'Do not use bash for file moves or renames; use move inside the writable sandbox.',
      'Do not use move to overwrite an existing destination.',
    ],
    parameters: moveParameters,

    async execute(_toolCallId, params: MoveParams, _signal, _onUpdate, ctx) {
      const from = params.from.trim();
      const to = params.to.trim();
      const resolvedFrom = Fs.resolve(ctx.cwd, from);
      const resolvedTo = Fs.resolve(ctx.cwd, to);
      const guard = await guardMove({ from, to, resolvedFrom, resolvedTo, policy });

      if (!guard.ok) return toMoveError(from, to, resolvedFrom, resolvedTo, guard.reason);

      try {
        await Fs.rename(resolvedFrom, resolvedTo);
        return toMoveSuccess(from, to, resolvedFrom, resolvedTo);
      } catch (error) {
        return toMoveError(
          from,
          to,
          resolvedFrom,
          resolvedTo,
          toMoveErrorMessage(resolvedFrom, resolvedTo, error),
        );
      }
    },
  });
}

export function registerCopy(pi: ExtensionApi, policy: SandboxFsPolicy) {
  pi.registerTool({
    name: 'copy',
    label: 'Copy',
    description:
      'Copy one regular file from a readable sandbox path to a writable sandbox path. No globs, no shell commands.',
    promptSnippet: 'Copy one regular file from a readable sandbox path to a writable sandbox path.',
    promptGuidelines: [
      'Use copy for exact artifact import from readable roots into the writable workspace.',
      'Do not use bash for file copies; use copy inside the sandbox.',
      'Do not use copy to overwrite an existing destination.',
    ],
    parameters: copyParameters,

    async execute(_toolCallId, params: CopyParams, _signal, _onUpdate, ctx) {
      const from = params.from.trim();
      const to = params.to.trim();
      const resolvedFrom = Fs.resolve(ctx.cwd, from);
      const resolvedTo = Fs.resolve(ctx.cwd, to);
      const guard = await guardCopy({ from, to, resolvedFrom, resolvedTo, policy });

      if (!guard.ok) return toCopyError(from, to, resolvedFrom, resolvedTo, guard.reason);

      try {
        await Fs.copyFile(resolvedFrom, resolvedTo);
        return toCopySuccess(from, to, resolvedFrom, resolvedTo);
      } catch (error) {
        return toCopyError(
          from,
          to,
          resolvedFrom,
          resolvedTo,
          toCopyErrorMessage(resolvedFrom, resolvedTo, error),
        );
      }
    },
  });
}
