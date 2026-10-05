import { useEffect, useState } from 'react';

/**
 * Effect: Dynamic ESM component Loader
 * HACK: Errors when this file is parsed within Deno on the server
 *       (because CJS not ESM (??))
 *       Only import the component when within a browser.
 */
export function useComponent<T>(fn: () => Promise<T>) {
  const [Component, setComponent] = useState<T>();
  if (!globalThis.window) return;

  useEffect(() => void fn().then((e) => setComponent(() => e)), []);

  return Component;
}
