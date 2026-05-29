import type { t } from '../common.ts';

/**
 * Unique listener pids in stable order.
 */
export function uniquePids(listeners: readonly t.Process.Port.Listener[]) {
  return Array.from(new Set(listeners.map((listener) => listener.pid))).sort((a, b) => a - b);
}

/**
 * Summarize per-pid termination results for the port-level result.
 */
export function portStatus(
  listeners: readonly t.Process.Port.Listener[],
  results: readonly t.Process.Terminate.Result[],
): t.Process.Terminate.Port.Status {
  if (listeners.length === 0) return 'not-listening';

  const running = results.filter((item) => item.status === 'still-running');
  if (running.length === results.length) return 'still-running';
  if (running.length > 0) return 'partial';
  if (results.some((item) => item.status === 'killed')) return 'killed';
  return 'terminated';
}
