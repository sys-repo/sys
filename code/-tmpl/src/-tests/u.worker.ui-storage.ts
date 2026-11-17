import { Signal } from '../../-templates/common.ts';
import { D as Plain } from '../../-templates/tmpl.m.mod.ui/common.ts';
import { D as Controller } from '../../-templates/tmpl.m.mod.ui.controller/common.ts';
import { createDebugSignals as createPlain } from '../../-templates/tmpl.m.mod.ui/-spec/-SPEC.Debug.tsx';
import { createDebugSignals as createController } from '../../-templates/tmpl.m.mod.ui.controller/-spec/-SPEC.Debug.tsx';

type Input = { variant: 'plain' | 'controller'; bytes?: string; failCreation?: boolean };

/**
 * A worker owns a fresh module/LocalStorage registry;
 * no production cache-reset hook.
 */
self.onmessage = async ({ data }: MessageEvent<Input>) => {
  const key = `dev:${data.variant === 'plain' ? Plain.displayName : Controller.displayName}`;
  const values = new Map<string, string>();
  if (data.bytes !== undefined) values.set(key, data.bytes);
  const failure = new Error('creation storage failed');

  const storage: Storage = {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) {
      if (data.failCreation) throw failure;
      values.set(key, value);
    },
    removeItem: (key) => void values.delete(key),
    clear: () => void values.clear(),
  };

  Object.defineProperty(globalThis, 'localStorage', { value: storage });
  try {
    const debug = await (data.variant === 'plain' ? createPlain() : createController());
    self.postMessage({ props: Signal.toObject(debug.props), bytes: values.get(key) });
  } catch (error) {
    self.postMessage({ original: error === failure, error: String(error) });
  }
};
