import type { Cli, CliFormat } from '@sys/cli/t';
import { describe, expectTypeOf, it, type t } from '../../../-test.ts';
import { Fmt } from '../mod.ts';

type Assert<T extends true> = t.Type.Assert<T>;
type Equal<A, B> = t.Type.Equal<A, B>;
type Proof = [
  Assert<Equal<t.CliFormat.Service.Input, Cli.Fmt.Service.Input>>,
  Assert<Equal<t.CliFormat.Service.Options, Cli.Fmt.Service.Options>>,
  Assert<Equal<t.CliFormat.Service.Presentation, Cli.Fmt.Service.Presentation>>,
  Assert<Equal<t.CliFormat.Service.FormatDetail, Cli.Fmt.Service.FormatDetail>>,
  Assert<Equal<t.CliFormat.Service.PresentationProvider, Cli.Fmt.Service.PresentationProvider>>,
  Assert<Equal<t.CliFormat.Service.Keyboard, Cli.Fmt.Service.Keyboard>>,
  Assert<
    Equal<
      Cli.Fmt.Service.FormatDetail,
      (
        args: { readonly detail: t.Service.Detail; readonly maxWidth?: number },
      ) => string | undefined
    >
  >,
];

describe('Cli.Fmt.Service public type projections', () => {
  it('projects the exact renderer and local capability through the public type plane', () => {
    expectTypeOf(Fmt.Service).toEqualTypeOf<CliFormat.Service.Lib>();
    expectTypeOf(Fmt.Service).toEqualTypeOf<Cli.Fmt.Service.Lib>();
    type _Proof = Proof;
  });
});
