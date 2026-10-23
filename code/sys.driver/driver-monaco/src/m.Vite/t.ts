import type { Plugin } from 'vite';

/**
 * Monaco runtime asset integration for Vite applications.
 */
export declare namespace MonacoVite {
  /** Public helper surface. */
  export type Lib = {
    /** Serve and emit the pinned Monaco runtime tree at the fixed `vs` release path. */
    plugin(): Plugin;
  };
}
