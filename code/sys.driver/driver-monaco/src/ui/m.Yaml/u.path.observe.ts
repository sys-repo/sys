import { type t, Bus, Rx } from './common.ts';
import { type Producer, createProducer } from './u.path.observe.singleton.ts';

type Registry = { refCount: number; producer: Producer };
const registry = new Map<t.StringId, Registry>();

/**
 * Public API: singleton-safe observe.
 */
export const observe: t.EditorYamlPathLib['observe'] = (args, until) => {
  const { editor } = args;
  const editorId = editor.getId();

  const life = Rx.lifecycle(until);
  const singleton = Bus.singleton(registry, editorId, () => createProducer(args));
  life.dispose$.pipe(Rx.take(1)).subscribe(singleton.dispose);

  return Rx.toLifecycle<t.EditorYamlCursorPathObserver>(life, {
    get $() {
      return singleton.producer.$.pipe(Rx.takeUntil(life.dispose$));
    },
    get current() {
      return singleton.producer.current;
    },
  });
};
