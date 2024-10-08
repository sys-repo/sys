import type { t } from '../common.ts';

export type IdLib = {
  readonly Is: t.IdIsLib;
  readonly Length: { cuid: number; slug: number };
  readonly cuid: t.IdGenerator;
  readonly slug: t.IdGenerator;

  init(length: number): {
    readonly length: number;
    generate(): string;
    is(input: any): boolean;
  };
};

export type IdGenerator = () => string;

export type IdIsLib = {
  cuid(input: any): boolean;
  slug(input: any): boolean;
};
