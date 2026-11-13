export type * from '../../common.t.ts';

/** Private, React-independent label subset; never exported by the package type plane. */
export type LabelInline =
  | { readonly kind: 'text' | 'code'; readonly value: string }
  | { readonly kind: 'strong' | 'emphasis'; readonly children: readonly LabelInline[] };
