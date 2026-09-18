import type { t } from '../common.ts';
import {
  type AuthoritySnapshot,
  createSynchronousAuthority,
  snapshotProperty,
  snapshotShape,
  snapshotsReady,
} from '../u/u.authority.ts';

type TerminalStream = object;
type CapturedTerminal = Readonly<{
  readonly invoke: () => boolean;
}>;

type DenoRuntime = {
  readonly stdin?: TerminalStream;
  readonly stdout?: TerminalStream;
  readonly stderr?: TerminalStream;
};

const apply = Reflect.apply;
const arrayPush = Array.prototype.push;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const runtime = globalThis as unknown as { readonly Deno?: DenoRuntime };
const deno = runtime.Deno;
const snapshots: AuthoritySnapshot[] = [snapshotProperty(globalThis, 'Deno')];
const stdin = capture(deno, 'stdin');
const stdout = capture(deno, 'stdout');
const stderr = capture(deno, 'stderr');
const authority = createSynchronousAuthority('Cli.Is terminal authority unavailable.', [
  () => snapshotsReady(snapshots),
]);
freeze(snapshots);

/** Whether captured standard-stream terminal providers still match module initialization. */
export const isTerminalAuthorityReady = authority.isReady;

export const terminal: t.CliIs.Lib['terminal'] = (stream) => {
  if (!authority.isReady()) return false;
  const captured = stream === 'stdin' ? stdin : stream === 'stdout' ? stdout : stderr;
  if (!captured) return false;
  try {
    return captured.invoke();
  } catch {
    return false;
  }
};

export const interactive: t.CliIs.Lib['interactive'] = () => {
  return terminal('stdin') && terminal('stdout');
};

function capture(
  owner: DenoRuntime | undefined,
  key: 'stdin' | 'stdout' | 'stderr',
): CapturedTerminal | undefined {
  if (!owner) return;
  apply(arrayPush, snapshots, [snapshotProperty(owner, key)]);
  const receiver = owner[key];
  if (!receiver) return;

  let methodOwner: object | null = receiver;
  while (methodOwner) {
    apply(arrayPush, snapshots, [snapshotShape(methodOwner)]);
    const descriptor = getOwnPropertyDescriptor(methodOwner, 'isTerminal');
    if (descriptor) {
      if (!('value' in descriptor) || typeof descriptor.value !== 'function') return;
      const method = descriptor.value;
      return freeze({
        invoke: () => apply(method, receiver, []) === true,
      });
    }
    methodOwner = getPrototypeOf(methodOwner);
  }
}
