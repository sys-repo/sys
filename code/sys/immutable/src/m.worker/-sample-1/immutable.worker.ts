import { Immutable } from '../../m.core/mod.ts';

export type Counter = { count: number };

// Authoritative state (inside worker):
const ref = Immutable.clonerRef<Counter>({ count: 0 });

// Stream out patches on each change:
ref.events().$.subscribe((e) => {
  if (e.patches.length > 0) {
    postMessage({ kind: 'patch', patches: e.patches } as const);
  }
});

// Respond to simple intents from main:
self.onmessage = (ev: MessageEvent) => {
  const msg = ev.data as { kind: 'increment' | 'set'; value?: number };
  if (msg.kind === 'increment') {
    ref.change((draft) => (draft.count = ref.current.count + 1));
  }
  if (msg.kind === 'set' && typeof msg.value === 'number') {
    ref.change((draft) => (draft.count = msg.value!));
  }
};

// Send initial snapshot once ready:
postMessage({ kind: 'init', state: ref.current } as const);
