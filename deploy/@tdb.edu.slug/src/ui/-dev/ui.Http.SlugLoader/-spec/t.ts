import type { t } from './common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type ProbeRun__ = (e: t.ProbeRunArgs__) => Promise<void>;
export type ProbeRunArgs__ = {
  readonly is: { readonly local: boolean };
  readonly origin: t.SlugUrlOrigin;
  readonly result: (value: unknown) => void;
};

export type ProbeSpec__ = {
  readonly label: t.ReactNode | (() => t.ReactNode);
  readonly run: ProbeRun__;
};
