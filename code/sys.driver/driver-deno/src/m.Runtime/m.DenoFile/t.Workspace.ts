import type { t } from './common.ts';

/**
 * An <Info> object for working with a Deno workspace.
 */
export type DenoWorkspace = {
  readonly exists: boolean;
  readonly dir: t.StringPath;
  readonly file: t.StringPath;
  readonly children: t.DenoWorkspaceChildren;
};

export type DenoWorkspaceChildren = {
  readonly dirs: t.StringDir[];
  load(): Promise<t.DenoFileLoadResponse[]>;
};
