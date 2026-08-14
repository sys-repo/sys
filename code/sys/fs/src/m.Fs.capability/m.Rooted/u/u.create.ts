import { Is, Rx, StdPath, type t } from '../common.ts';
import { checkCancelled, failure, ioFailure, isFailure, runOperation } from './u.error.ts';
import { publishFile } from './u.file.ts';
import { DEFAULT_IO, type Io } from './u.io.ts';
import {
  acquireLease as acquireTargetLease,
  leaseInput,
  type LeaseRegistry,
  type LeaseState,
} from './u.lease.ts';
import {
  inspectOwnedSeal,
  ownedTreeInput,
  removeOwnedTree,
  removeTreeInput,
  sealOwnedTree,
} from './u.owner.ts';
import { createRootState, observeTarget, type TargetState } from './u.path.ts';
import {
  createStage,
  discardStage,
  promoteStage,
  promotionInput,
  type StageState,
} from './u.stage.ts';
import { normalizeTargets } from './u.target.ts';

/** Internal factory with injectable filesystem operations for deterministic tests. */
export async function createRooted(
  options: t.FsRooted.CreateOptions,
  io: Io = DEFAULT_IO,
): Promise<t.FsRooted.Instance> {
  if (!Is.object(options)) throw failure('create', 'invalid-root');

  return await runOperation('create', options, async (signal) => {
    const root = await createRootState(options.root, io, signal);
    const targets = new WeakMap<object, TargetState>();
    const stages = new WeakMap<object, StageState>();
    const leases = new WeakMap<object, LeaseState>();
    const leaseRegistry: LeaseRegistry = new Map();

    const api: t.FsRooted.Instance = Object.freeze({
      path: root.path,

      admit<K extends t.FsRooted.TargetKind>(
        input: readonly t.FsRooted.TargetInput<K>[],
        operationOptions?: t.FsRooted.OperationOptions,
      ) {
        return runOperation('admit', operationOptions, async (operationSignal) => {
          const normalized = normalizeTargets(input);
          const handles: t.FsRooted.Target<K>[] = [];

          for (const item of normalized) {
            const target: TargetState<K> = Object.freeze({
              ...item,
              absolute: StdPath.join(root.path, item.path) as t.StringAbsolutePath,
            });
            await observeTarget(io, root, target, 'admit', operationSignal, false);
            const handle = Object.freeze({
              kind: target.kind,
              path: target.path,
            }) as t.FsRooted.Target<K>;
            targets.set(handle, target);
            handles.push(handle);
          }

          checkCancelled('admit', operationSignal);
          return Object.freeze({
            targets: Object.freeze(handles),
          }) as t.FsRooted.Admission<K>;
        });
      },

      async acquireLease(handles, options) {
        const input = leaseInput(
          handles,
          options,
          (handle) => targetState(targets, handle, 'directory', 'acquire-lease'),
        );
        return await runOperation(
          'acquire-lease',
          { until: input.until },
          (operationSignal) => {
            return acquireTargetLease(
              io,
              root,
              input,
              operationSignal,
              leases,
              leaseRegistry,
            );
          },
        );
      },

      async inspectSeal(tree, options) {
        const input = ownedTreeInput(options, 'inspect-seal');
        return await runOperation('inspect-seal', input, (operationSignal) => {
          return inspectOwnedSeal(
            io,
            root,
            targets,
            stages,
            leases,
            leaseRegistry,
            tree,
            input,
            operationSignal,
          );
        });
      },

      async sealTree(tree, options) {
        const input = ownedTreeInput(options, 'seal-tree');
        return await runOperation('seal-tree', input, (operationSignal) => {
          return sealOwnedTree(
            io,
            root,
            targets,
            stages,
            leases,
            leaseRegistry,
            tree,
            input,
            operationSignal,
          );
        });
      },

      async removeTree(handle, options) {
        const input = removeTreeInput(options);
        return await runOperation(
          'remove-tree',
          { until: input.until },
          (operationSignal) => {
            return removeOwnedTree(
              io,
              root,
              targets,
              leases,
              handle,
              input,
              operationSignal,
            );
          },
        );
      },

      publishFile(handle, bytes, operationOptions) {
        return runOperation('publish-file', operationOptions, (operationSignal) => {
          const target = targetState(targets, handle, 'file', 'publish-file');
          return publishFile(io, root, target, bytes, operationSignal);
        });
      },

      createStage(operationOptions) {
        return runOperation('create-stage', operationOptions, (operationSignal) => {
          return createStage(
            io,
            root,
            operationSignal,
            (stageRoot) => createRooted({ root: stageRoot, until: operationSignal }, io),
            stages,
          );
        });
      },

      discardStage(stage, operationOptions) {
        return runOperation('discard-stage', operationOptions, async () => {
          try {
            await discardStage(io, stages, stage);
          } catch (cause) {
            if (isFailure(cause)) throw cause;
            throw ioFailure('discard-stage', cause);
          }
        });
      },

      async promoteStage(stage, handle, options) {
        const input = promotionInput(options);
        const life = Rx.abortable(input.until);
        try {
          const target = targetState(targets, handle, 'directory', 'promote-stage');
          return await promoteStage(
            io,
            root,
            stages,
            leases,
            leaseRegistry,
            stage,
            target,
            life.signal,
            input,
          );
        } finally {
          life.dispose();
        }
      },
    });

    return api;
  });
}

function targetState<K extends t.FsRooted.TargetKind>(
  targets: WeakMap<object, TargetState>,
  handle: t.FsRooted.Target<K>,
  kind: K,
  operation: t.FsRooted.Operation,
): TargetState<K> {
  const target = Is.object(handle) ? targets.get(handle) : undefined;
  if (!target) throw failure(operation, 'foreign-handle');
  if (target.kind !== kind) throw failure(operation, 'invalid-target');
  return target as TargetState<K>;
}
