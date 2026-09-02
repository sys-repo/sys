import { Fs, Is, StartGuiIntrinsic, type t } from '../common.ts';

import { snapshotCapturedAbortSignal } from '../u.abort.ts';
import { DEFAULT_DEPENDENCIES, type StartGuiDependencies } from '../u.deps.ts';
import { createOwnedError, ownedError } from '../u.error.ts';

/** Input-specific package authority captured before caller-controlled values can run. */
const InputAuthority = StartGuiIntrinsic.freeze({
  isAbsolutePath: Fs.Path.Is.absolute,
});

const START_INPUT_ERROR = 'start:gui input invalid.';
const DEPENDENCIES_ERROR = 'start:gui dependencies invalid.';
const START_INPUT_KEYS = ['cwd', 'until', 'source', 'deps'] as const;
const CWD_KEYS = ['invoked', 'root', 'git'] as const;
const DEPENDENCY_KEYS = [
  'materialize',
  'start',
  'startStatus',
  'ensureDir',
  'createRooted',
  'open',
  'bindKeyboard',
  'createScreen',
] as const;
const DEFAULT_SNAPSHOT_DEPENDENCIES = receiverlessDependencies(DEFAULT_DEPENDENCIES);

type StartInputSnapshot = Readonly<{
  root: t.StringDir;
  until?: AbortSignal;
  source?: unknown;
  deps?: unknown;
}>;

type OptionalData =
  | Readonly<{ present: true; value: unknown }>
  | Readonly<{ present: false }>;

export function snapshotStartInput(input: unknown): StartInputSnapshot {
  try {
    if (!isDirectInputObject(input) || !hasAdmittedKeys(input, START_INPUT_KEYS, 1)) {
      refuseStartInput();
    }

    const cwd = ownEnumerableData(input, 'cwd');
    if (!cwd.present) refuseStartInput();
    const root = snapshotCwdRoot(cwd.value);

    const untilInput = optionalInputValue(input, 'until');
    const until = untilInput.present ? snapshotCapturedAbortSignal(untilInput.value) : undefined;
    if (untilInput.present && !until) refuseStartInput();

    const source = optionalInputValue(input, 'source');
    const deps = optionalInputValue(input, 'deps');
    return StartGuiIntrinsic.freeze({
      root,
      ...(until ? { until } : {}),
      ...(source.present ? { source: source.value } : {}),
      ...(deps.present ? { deps: deps.value } : {}),
    });
  } catch (cause) {
    throw ownedError(cause, START_INPUT_ERROR);
  }
}

export function snapshotDependencies(input: unknown): StartGuiDependencies {
  if (input === undefined) return DEFAULT_SNAPSHOT_DEPENDENCIES;
  try {
    if (!isDirectInputObject(input) || !hasAdmittedKeys(input, DEPENDENCY_KEYS)) {
      refuseDependencies();
    }
    const candidate: StartGuiDependencies = {
      materialize: dependency(input, 'materialize'),
      start: dependency(input, 'start'),
      startStatus: dependency(input, 'startStatus'),
      ensureDir: dependency(input, 'ensureDir'),
      createRooted: dependency(input, 'createRooted'),
      open: dependency(input, 'open'),
      bindKeyboard: dependency(input, 'bindKeyboard'),
      createScreen: dependency(input, 'createScreen'),
    };
    return receiverlessDependencies(candidate);
  } catch (cause) {
    throw ownedError(cause, DEPENDENCIES_ERROR);
  }
}

function snapshotCwdRoot(input: unknown): t.StringDir {
  if (!isDirectInputObject(input) || !hasAdmittedKeys(input, CWD_KEYS, 2)) {
    refuseStartInput();
  }

  const invoked = ownEnumerableData(input, 'invoked');
  const root = ownEnumerableData(input, 'root');
  const git = ownEnumerableData(input, 'git');
  if (!invoked.present || !isAdmittedPath(invoked.value)) refuseStartInput();
  if (root.present && !isAdmittedPath(root.value)) refuseStartInput();
  if (git.present && !isAdmittedPath(git.value)) refuseStartInput();
  if (!root.present && !git.present) refuseStartInput();
  if (root.present && git.present && root.value !== git.value) refuseStartInput();
  if (root.present) return root.value as t.StringDir;
  if (git.present) return git.value as t.StringDir;
  return refuseStartInput();
}

function optionalInputValue(input: object, key: PropertyKey): OptionalData {
  const value = ownEnumerableData(input, key);
  if (value.present && value.value === undefined) refuseStartInput();
  return value;
}

function ownEnumerableData(input: object, key: PropertyKey): OptionalData {
  const descriptor = StartGuiIntrinsic.ownPropertyDescriptor(input, key);
  if (!descriptor) return StartGuiIntrinsic.freeze({ present: false as const });
  return descriptor.enumerable === true && 'value' in descriptor
    ? StartGuiIntrinsic.freeze({ present: true as const, value: descriptor.value })
    : StartGuiIntrinsic.freeze({ present: false as const });
}

function hasAdmittedKeys(
  input: object,
  admitted: readonly string[],
  minimum = 0,
): boolean {
  const keys = StartGuiIntrinsic.ownKeys(input);
  if (keys.length < minimum || keys.length > admitted.length) return false;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (
      !Is.string(key) || !StartGuiIntrinsic.arrayIncludes(admitted, key) ||
      !ownEnumerableData(input, key).present
    ) return false;
  }
  return true;
}

function isDirectInputObject(input: unknown): input is object {
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
  try {
    return StartGuiIntrinsic.hasObjectPrototype(input);
  } catch {
    return false;
  }
}

function isAdmittedPath(input: unknown): input is t.StringDir {
  return Is.string(input) && input.length > 0 && input.length <= 4_096 &&
    !StartGuiIntrinsic.stringIncludes(input, '\0') &&
    StartGuiIntrinsic.invoke(InputAuthority.isAbsolutePath, [input]) === true;
}

function dependency<K extends keyof StartGuiDependencies>(
  input: object,
  key: K,
): StartGuiDependencies[K] {
  const descriptor = StartGuiIntrinsic.ownPropertyDescriptor(input, key);
  if (!descriptor) return DEFAULT_DEPENDENCIES[key];
  if (descriptor.enumerable !== true || !('value' in descriptor)) refuseDependencies();
  const value = descriptor.value;
  if (!Is.func(value) || Is.Native.proxy(value)) refuseDependencies();
  return value as StartGuiDependencies[K];
}

function refuseStartInput(): never {
  throw createOwnedError(START_INPUT_ERROR);
}

function refuseDependencies(): never {
  throw createOwnedError(DEPENDENCIES_ERROR);
}

function receiverlessDependencies(input: StartGuiDependencies): StartGuiDependencies {
  const materialize = input.materialize;
  const start = input.start;
  const startStatus = input.startStatus;
  const ensureDir = input.ensureDir;
  const createRooted = input.createRooted;
  const open = input.open;
  const bindKeyboard = input.bindKeyboard;
  const createScreen = input.createScreen;
  return StartGuiIntrinsic.freeze({
    materialize(...args) {
      return StartGuiIntrinsic.invoke(materialize, args);
    },
    start(...args) {
      return StartGuiIntrinsic.invoke(start, args);
    },
    startStatus(...args) {
      return StartGuiIntrinsic.invoke(startStatus, args);
    },
    ensureDir(...args) {
      return StartGuiIntrinsic.invoke(ensureDir, args);
    },
    createRooted(...args) {
      return StartGuiIntrinsic.invoke(createRooted, args);
    },
    open(...args) {
      return StartGuiIntrinsic.invoke(open, args);
    },
    bindKeyboard(...args) {
      return StartGuiIntrinsic.invoke(bindKeyboard, args);
    },
    createScreen(...args) {
      return StartGuiIntrinsic.invoke(createScreen, args);
    },
  });
}
