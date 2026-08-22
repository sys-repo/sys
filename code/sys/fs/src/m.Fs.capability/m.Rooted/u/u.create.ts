import { Is as ServerIs } from '@sys/std/is/server';

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
import { createRootState, identityRequired, observeTarget, type TargetState } from './u.path.ts';
import { readFile, readFileOptions } from './u.read.ts';
import {
  createStage,
  discardStage,
  promoteStage,
  promotionInput,
  type StageState,
} from './u.stage.ts';
import { normalizeTargets } from './u.target.ts';

const operation = 'create' as const;
const OPTION_KEYS = ['root', 'create', 'until'] as const;

type CreateInput = {
  readonly root: t.StringPath;
  readonly create: boolean;
  readonly until?: t.UntilInput;
};

/** Internal factory with injectable filesystem operations for deterministic tests. */
export async function createRooted(
  options: t.FsRooted.CreateOptions,
  io: Io = DEFAULT_IO,
): Promise<t.FsRooted.Instance> {
  const input = createInput(options);
  return await runOperation(operation, input, async (signal) => {
    const root = await createRootState(input.root, io, signal, input.create);
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
          const observedIdentities = new Map<string, t.StringRelativePath>();

          for (const item of normalized) {
            const target: TargetState<K> = Object.freeze({
              ...item,
              absolute: StdPath.join(root.path, item.path) as t.StringAbsolutePath,
            });
            const info = await observeTarget(
              io,
              root,
              target,
              'admit',
              operationSignal,
              false,
            );
            if (info) {
              const identity = identityRequired(info, 'admit');
              const key = `${identity.dev}:${identity.ino}`;
              if (observedIdentities.has(key)) throw failure('admit', 'target-collision');
              observedIdentities.set(key, target.path);
            }
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

      async readFile(handle, operationOptions) {
        const input = readFileOptions(operationOptions);
        return await runOperation('read-file', input, (operationSignal) => {
          const target = targetState(targets, handle, 'file', 'read-file');
          return readFile(io, root, target, input.maxBytes, operationSignal);
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

/** Snapshot exact root-creation authority before observing or mutating the filesystem. */
function createInput(input: unknown): CreateInput {
  try {
    if (!Is.object(input) || ServerIs.proxy(input) || !Is.plainObject(input)) {
      throw failure(operation, 'invalid-options');
    }
    const keys = Reflect.ownKeys(input);
    if (keys.some((key) => !Is.str(key) || !OPTION_KEYS.some((name) => name === key))) {
      throw failure(operation, 'invalid-options');
    }

    const root = ownValue(input, 'root');
    const create = ownValue(input, 'create');
    const until = ownValue(input, 'until');
    if (!Is.str(root) || (create !== undefined && !Is.bool(create)) || !Is.untilInput(until)) {
      throw failure(operation, 'invalid-options');
    }
    return Object.freeze({
      root: root as t.StringPath,
      create: create ?? true,
      until,
    });
  } catch {
    throw failure(operation, 'invalid-options');
  }
}

function ownValue(input: object, key: (typeof OPTION_KEYS)[number]): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  if (!descriptor) return undefined;
  if (!('value' in descriptor)) throw failure(operation, 'invalid-options');
  return descriptor.value;
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
