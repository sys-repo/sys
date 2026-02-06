import type { t } from './-common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type FetchAction = (e: t.FetchActionArgs) => Promise<void>;
export type FetchActionArgs = {
  readonly is: { readonly local: boolean };
  readonly origin: t.SlugUrlOrigin;
  readonly result: (value: unknown) => void;
};

export type FetchSample = {
  readonly label: t.ReactNode | (() => t.ReactNode);
  readonly run: FetchAction;
};
