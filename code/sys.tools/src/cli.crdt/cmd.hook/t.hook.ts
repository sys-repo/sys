import type { t } from '../common.ts';

/**
 * Exports from an imported `hook.ts` file.
 */
export type RootHookModule = {
  /** Optional plugin extensions (eg. lint tasks). */
  readonly plugins?: readonly RootHookPlugin[];
};

/**
 * Root-level plugin interface.
 */
export type RootHookPlugin = {
  /** Stable identifier (default menu label). */
  readonly id: string;

  /** Optional menu label override. */
  readonly title?: string;

  /** Execute plugin action. */
  readonly run: (args: {
    cwd: t.StringDir;
    cmd: t.Crdt.Cmd.Client;
  }) => RootHookPluginResult | Promise<RootHookPluginResult>;
};

/**
 * Plugin action result.
 */
export const RootHookPluginResultKind = {
  Exit: 'exit',
  Back: 'back',
  Stay: 'stay',
} as const;

export type RootHookPluginResultKind =
  typeof RootHookPluginResultKind[keyof typeof RootHookPluginResultKind];

export type RootHookPluginResult =
  | { kind: RootHookPluginResultKind }
  | RootHookPluginResultKind
  | undefined;
