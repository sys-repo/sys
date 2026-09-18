import type { t } from '../common.ts';

export type SelectionState = 'selected' | 'blocked' | 'current' | 'registry-behind-current';

export type SelectionOption = {
  readonly name: string;
  readonly value: string;
  readonly checked: boolean;
  readonly disabled?: boolean;
};

export type SelectionLayout = {
  readonly name: number;
  readonly current: number;
  readonly latest: number;
  readonly note: number;
  readonly overrideParents: ReadonlySet<string>;
};

export type PackagePolicyCollect = { readonly packageJson?: t.EsmDeps.PackageJsonPolicy };
export type PackagePolicyCarrier = { readonly collect: PackagePolicyCollect };

export type SelectionLayoutInput = {
  readonly options?: { readonly evaluatedAt: t.UnixTimestamp };
  readonly policy: { readonly decisions: readonly t.EsmPolicy.Decision[] };
  readonly collect: PackagePolicyCollect & {
    readonly candidates: readonly t.WorkspaceUpgrade.Candidate[];
  };
};

export type UpdatedRow = {
  readonly entry: t.EsmDeps.Entry;
  readonly from: t.StringSemver;
  readonly to: t.StringSemver;
};

export type SummaryCounts = {
  readonly dependencies: number;
  readonly blocked: number;
  readonly standdown: number;
  readonly current: number;
  readonly registryBehindCurrent: number;
};

export type RegistryProgress = t.WorkspaceUpgrade.RegistryProgress;

export type BlockedCode =
  | 'policy:none'
  | 'policy:excluded'
  | 'version:none-available'
  | 'version:not-newer'
  | 'version:not-allowed';
