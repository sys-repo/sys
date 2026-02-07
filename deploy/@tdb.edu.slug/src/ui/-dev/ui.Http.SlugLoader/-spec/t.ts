import type { t } from './common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type DescriptorMode = 'descriptor' | t.BundleDescriptorKind;

export type TEnv = {
  is: { local: boolean };
  readonly origin: t.SlugUrlOrigin;
  readonly descriptorKind?: DescriptorMode;
  readonly onDescriptorKindChange?: (next: DescriptorMode) => void;
};
