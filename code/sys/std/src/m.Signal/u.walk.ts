import { type t } from './common.ts';
import { Is } from './m.Is.ts';

export const walk: t.SignalWalk = (parent, fn, options) => {
  let count = 0;
  let stopped = false;

  const seen = new WeakSet<object>();
  const isObj = (v: unknown): v is object => typeof v === 'object' && v !== null;

  const visit = (node: unknown, path: t.ObjectPath, container: object | any[]) => {
    if (stopped || !isObj(node)) return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (stopped) break;
        const child = (node as any)[i];
        if (Is.signal(child)) {
          const s = child as t.Signal<any>;
          const entry: t.SignalWalkEntry<any> = {
            parent: node,
            path: [...path, i],
            key: i,
            signal: s as unknown as t.ReadonlySignal<any>,
            get value() {
              return (s as any).value as any;
            },
            mutate: (v) => {
              if (options?.skipUndefined && v === undefined) return;
              if (Object.is((s as any).value, v)) return;
              (s as any).value = v;
            },
            stop: () => {
              stopped = true;
            },
          };
          fn(entry);
          count++;
        } else {
          visit(child, [...path, i], node);
        }
      }
      return;
    }

    for (const k of Object.keys(node as object)) {
      if (stopped) break;
      const child = (node as any)[k];
      if (Is.signal(child)) {
        const s = child as t.Signal<any>;
        const entry: t.SignalWalkEntry<any> = {
          parent: node as object,
          path: [...path, k],
          key: k,
          signal: s as unknown as t.ReadonlySignal<any>,
          get value() {
            return (s as any).value as any;
          },
          mutate: (v) => {
            if (options?.skipUndefined && v === undefined) return;
            if (Object.is((s as any).value, v)) return;
            (s as any).value = v;
          },
          stop: () => {
            stopped = true;
          },
        };
        fn(entry);
        count++;
      } else if (isObj(child)) {
        visit(child, [...path, k], node as object);
      }
    }
  };

  visit(parent as unknown, [], Array.isArray(parent) ? parent : (parent as object));
  return count;
};
