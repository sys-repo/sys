import type { ExtensionContext } from '@earendil-works/pi-coding-agent';

/**
 * Refuse unused host capabilities without loading a test runner into permission-restricted fixtures.
 */
export function context(cwd: string): ExtensionContext {
  const unused = (): never => {
    throw new Error('ZIP accessed an unused host capability.');
  };
  return {
    cwd,
    mode: 'tui',
    hasUI: false,
    model: undefined,
    scopedModels: [],
    signal: undefined,
    get ui() {
      return unused();
    },
    get sessionManager() {
      return unused();
    },
    get modelRegistry() {
      return unused();
    },
    isIdle: unused,
    isProjectTrusted: unused,
    abort: unused,
    hasPendingMessages: unused,
    shutdown: unused,
    getContextUsage: unused,
    compact: unused,
    getSystemPrompt: unused,
  };
}
