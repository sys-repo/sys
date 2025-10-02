/**
 * Hook: useFunction
 *
 * Returns a stable callback that always calls the latest function.
 * Intended for passing functions into hooks/effects without resubscription churn.
 */
export type UseFunction = <T extends (...args: any[]) => unknown>(fn: T | undefined) => T;
