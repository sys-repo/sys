import type { InlineConfig } from 'vite';

/** Written-project ownership shared only by the integrity build specifications. */
export type BuildFixture = {
  readonly root: string;
  readonly config: InlineConfig;
  [Symbol.asyncDispose](): Promise<void>;
};
