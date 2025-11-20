import type { t } from './common.ts';

type Config = t.CrdtWorkerSpawnConfig;

let config: Config | undefined;
const handlers: ((c: Config) => void | Promise<void>)[] = [];

/**
 * Called when the spawn-time config arrives
 * on the `crdt:attach` message.
 */
export function deliverConfig(value: Config) {
  if (config) return; // first win
  config = value;
  const pending = handlers.splice(0, handlers.length);
  for (const fn of pending) void fn(value);
}

/**
 * Worker-side: register a one-shot config handler.
 * If config already exists, fires immediately.
 */
export function onConfig<T extends Config>(handler: (config: T) => void | Promise<void>): void {
  if (config) {
    void handler(config as T);
  } else {
    handlers.push(handler as (c: Config) => void | Promise<void>);
  }
}
