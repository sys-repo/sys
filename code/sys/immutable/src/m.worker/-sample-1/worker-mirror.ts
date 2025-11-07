import { applyJsonPatch } from './json-patch.ts';
export type Counter = { count: number };

export type ImmutableMirror<T> = {
  readonly current: T;
  apply(patches: readonly PatchOp[]): void;
};

export type PatchOp =
  | { op: 'add'; path: string; value: unknown }
  | { op: 'replace'; path: string; value: unknown }
  | { op: 'remove'; path: string };

// Create a mirror and wire it to a worker:
export function createWorkerMirror<T>(url: URL): {
  readonly worker: Worker;
  readonly ref: ImmutableMirror<T>;
} {
  const worker = new Worker(url, { type: 'module' });

  let _current!: T; // set on first "init"

  const ref: ImmutableMirror<T> = {
    get current() {
      return _current;
    },
    apply(patches) {
      _current = applyJsonPatch(_current, patches);
    },
  };

  worker.onmessage = (ev: MessageEvent) => {
    const msg = ev.data as
      | { kind: 'init'; state: T }
      | { kind: 'patch'; patches: readonly PatchOp[] };

    if (msg.kind === 'init') {
      _current = msg.state;
      return;
    }

    if (msg.kind === 'patch' && Array.isArray(msg.patches) && msg.patches.length > 0) {
      ref.apply(msg.patches);
    }
  };

  return { worker, ref };
}
