import type { CliFormatCode as CliFormatCodeFromEntry } from '@sys/cli/fmt/code';
import { describe, expectTypeOf, it, type t } from '../../../-test.ts';
import { Code, Fmt } from '../mod.ts';
import type { CliFormatCode } from '../t.ts';

type Assert<T extends true> = t.Type.Assert<T>;
type Equal<A, B> = t.Type.Equal<A, B>;
type ExpectedLayoutOptions = {
  readonly indent?: number;
  readonly fence?: boolean;
};
type ExpectedBlockOptions = ExpectedLayoutOptions & {
  readonly lang?: string;
  readonly tone?: 'default' | 'muted';
};

type CanonicalCodeFormatterProof = [
  Assert<Equal<CliFormatCode.LayoutOptions, ExpectedLayoutOptions>>,
  Assert<Equal<CliFormatCode.Tone, 'default' | 'muted'>>,
  Assert<Equal<CliFormatCode.Block.Options, ExpectedBlockOptions>>,
  Assert<Equal<CliFormatCode.Lib, CliFormatCodeFromEntry.Lib>>,
  Assert<Equal<CliFormatCode.Fmt.Lib, CliFormatCodeFromEntry.Fmt.Lib>>,
  Assert<Equal<CliFormatCode.LayoutOptions, CliFormatCodeFromEntry.LayoutOptions>>,
  Assert<Equal<CliFormatCode.Tone, CliFormatCodeFromEntry.Tone>>,
  Assert<Equal<CliFormatCode.Block.Options, CliFormatCodeFromEntry.Block.Options>>,
  Assert<Equal<CliFormatCode.Highlight.Options, CliFormatCodeFromEntry.Highlight.Options>>,
  Assert<
    Equal<CliFormatCode.Highlight.ShikiOptions, CliFormatCodeFromEntry.Highlight.ShikiOptions>
  >,
  Assert<
    Equal<
      CliFormatCode.Highlight.ShikiOptionsWithDefaultTheme,
      CliFormatCodeFromEntry.Highlight.ShikiOptionsWithDefaultTheme
    >
  >,
];

describe('Cli.Fmt.Code: canonical type namespace', () => {
  it('stays exact through the isolated code formatter entrypoint', () => {
    expectTypeOf(Code).toEqualTypeOf<CliFormatCode.Lib>();
    expectTypeOf(Code).toEqualTypeOf<CliFormatCodeFromEntry.Lib>();
    expectTypeOf(Fmt).toEqualTypeOf<CliFormatCode.Fmt.Lib>();
    expectTypeOf(Fmt).toEqualTypeOf<CliFormatCodeFromEntry.Fmt.Lib>();

    type _CanonicalCodeFormatterProof = CanonicalCodeFormatterProof;
  });
});
