import type { t } from './-common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type FetchAction = (e: t.FetchActionArgs) => Promise<void>;
export type FetchActionArgs = {
  readonly local: boolean;
  readonly origin: t.SlugLoaderOrigin;
  readonly baseUrl?: t.StringUrl;
  readonly manifestsDir?: t.StringDir;
  readonly docid?: t.StringId;
  readonly hash?: string;
  result(value: unknown): void;
};

export type FetchSample = {
  readonly label: string;
  readonly run: FetchAction;
};
