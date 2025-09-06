import { type t } from './common.ts';
import { Is } from './m.Is.ts';

export function walk<T extends object | any[]>(
  parent: T,
  fn: t.SignalWalkFn<t.SignalValueOf<T>>,
  options?: t.SignalWalkOptions,
): number;
export function walk(parent: unknown, fn: t.SignalWalkFn, options?: t.SignalWalkOptions): number;

// Implementation
export function walk(parent: unknown, fn: t.SignalWalkFn, options?: t.SignalWalkOptions): number {
  let count = 0;
  let stopped = false;

  const seen = new WeakSet<object>();
  const isObj = (v: unknown): v is object => typeof v === 'object' && v !== null;

  const visit = (node: unknown, path: t.ObjectPath): void => {
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
              const curr = (s as any).value;
              if (Object.is(curr, v)) return;
              (s as any).value = v;
            },
            stop: () => {
              stopped = true;
            },
          };
          (fn as t.SignalWalkFn<any>)(entry);
          count++;
        } else {
          visit(child, [...path, i]);
        }
      }
      return;
    }

    for (const k of Object.keys(node)) {
      if (stopped) break;
      const child = (node as any)[k];
      if (Is.signal(child)) {
        const s = child as t.Signal<any>;
        const entry: t.SignalWalkEntry<any> = {
          parent: node,
          path: [...path, k],
          key: k,
          signal: s as unknown as t.ReadonlySignal<any>,
          get value() {
            return (s as any).value as any;
          },
          mutate: (v) => {
            if (options?.skipUndefined && v === undefined) return;
            const curr = (s as any).value;
            if (Object.is(curr, v)) return;
            (s as any).value = v;
          },
          stop: () => {
            stopped = true;
          },
        };
        (fn as t.SignalWalkFn<any>)(entry);
        count++;
      } else if (isObj(child)) {
        visit(child, [...path, k]);
      }
    }
  };

  visit(parent, []);
  return count;
}
