import type { t } from './common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type DescriptorMode = t.BundleDescriptorKind;
export type DescriptorParams = {
  path: string;
  kind: DescriptorMode;
};

export type TEnv = {
  is: { local: boolean };
  readonly origin: t.SlugUrlOrigin;
  readonly descriptorKind?: DescriptorMode;
  readonly onDescriptorKindChange?: (next: DescriptorMode) => void;
};
