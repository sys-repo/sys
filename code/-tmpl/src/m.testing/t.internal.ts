import type { t } from './common.ts';
export type * from '../common.t.ts';

export type ImportMap = {
  readonly imports: Record<string, string>;
};

export type PackageJson = {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
};

export type WorkspaceAuthorities = {
  readonly imports: Record<string, string>;
  readonly packageJson: PackageJson;
};

export type ModuleDeno = {
  readonly name?: unknown;
  readonly exports?: Record<string, unknown>;
};

export type FixtureRoot = {
  readonly parent: t.StringAbsoluteDir;
  readonly dir: string;
  readonly root: t.StringAbsoluteDir;
};
