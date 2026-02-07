import type { t } from './common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type FetchAction__ = (e: t.FetchActionArgs__) => Promise<void>;
export type FetchActionArgs__ = {
  readonly is: { readonly local: boolean };
  readonly origin: t.SlugUrlOrigin;
  readonly result: (value: unknown) => void;
};

export type FetchSample__ = {
  readonly label: t.ReactNode | (() => t.ReactNode);
  readonly run: FetchAction__;
};
