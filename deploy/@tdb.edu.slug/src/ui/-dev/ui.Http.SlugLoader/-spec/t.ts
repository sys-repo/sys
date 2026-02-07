import type { t } from './common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type DescriptorMode = t.BundleDescriptorKind;
export type DescriptorParams = {
  path: string;
  kind: DescriptorMode;
};
export type TreeContentParams = {
  basePath: string;
  docid: string;
  manifestsDir: string;
  contentDir: string;
};

export type TEnv = {
  is: { local: boolean };
  readonly origin: t.SlugUrlOrigin;
  readonly probe?: {
    readonly descriptor?: {
      readonly kind?: DescriptorMode;
      readonly onKindChange?: (next: DescriptorMode) => void;
    };
    readonly treeContent?: {
      readonly refs?: string[];
      readonly ref?: string;
      readonly onRefChange?: (next: string) => void;
      readonly onRefsChange?: (next: string[]) => void;
    };
  };
};
