import type { t } from './common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type DescriptorMode = t.BundleDescriptorKind;
export type DescriptorParams = {
  kind: DescriptorMode;
};
export type TreeContentParams = {
  basePath: string;
  docid: string;
  manifestsDir: string;
  contentDir: string;
};
export type FileContentData = Readonly<{
  docid: string;
  ref: string;
  hash: string;
  tree: t.SlugTreeDoc;
  content: t.SlugFileContentDoc;
  contentIndex: t.SlugFileContentIndex;
}>;

export type TEnv = {
  is: { local: boolean };
  readonly origin: t.SlugUrlOrigin;
  readonly probe?: {
    readonly selectionList?: {
      readonly totalVisible?: number | 'all';
    };
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
    readonly treePlayback?: {
      readonly refs?: string[];
      readonly ref?: string;
      readonly onRefChange?: (next: string) => void;
      readonly onRefsChange?: (next: string[]) => void;
    };
  };
};
