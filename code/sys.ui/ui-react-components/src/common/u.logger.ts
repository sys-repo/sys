/**
 * Create a namespaced console logger with timestamped output.
 *
 * @example
 * const log = makeLogger('MyModule');
 * log('message', data);
 */
export function makeLogger(category: string) {
  return (...args: unknown[]) => {
    const time = new Date().toISOString().slice(11, 23);
    console.log(`%c[${category}] ${time}`, 'color:#0af;font-weight:bold;', ...args);
  };
}
