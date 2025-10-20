export type Call = readonly unknown[];

/**
 * Stub out the environment's console.
 */
export function stubConsole(method: 'log' | 'info' | 'warn' | 'error' | 'debug') {
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  const calls: Record<typeof method, Call[]> = {
    [method]: [],
  } as unknown as Record<typeof method, Call[]>;

  (console as any)[method] = (...args: unknown[]) => {
    calls[method].push(args as Call);
  };

  const restore = () => {
    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
    console.debug = original.debug;
  };

  return { calls, restore };
}
