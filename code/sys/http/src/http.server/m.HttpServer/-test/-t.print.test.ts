import type { Cli } from '@sys/cli/t';
import type { HttpServer as Http } from '@sys/http/t';
import { describe, expectTypeOf, it, type t } from '../../../-test.ts';
import { HttpServer } from '../mod.ts';

type FormatDetail = Cli.Fmt.Service.FormatDetail;
type Presentation = Cli.Fmt.Service.Presentation;
type Assert<T extends true> = t.Type.Assert<T>;
type Equal<A, B> = t.Type.Equal<A, B>;

describe('HttpServer print types', () => {
  it('accepts the shared detail formatter in print and start options', () => {
    type _Proof = [
      Assert<Equal<Http.Print.FormatDetail, FormatDetail>>,
      Assert<Equal<Http.Print.Options['formatDetail'], FormatDetail | undefined>>,
      Assert<Equal<Http.Start.Options['formatDetail'], FormatDetail | undefined>>,
    ];
  });

  it('exposes optional presentation on the running server', () => {
    type _Proof = Assert<Equal<Http.Started['servicePresentation'], Presentation | undefined>>;
  });

  it('accepts shared keyboard hints in print options', () => {
    type _Proof = [
      Assert<Equal<Http.Print.Keyboard.Options, Cli.Fmt.Service.Keyboard>>,
      Assert<Equal<Http.Print.Options['keyboard'], Cli.Fmt.Service.Keyboard | undefined>>,
    ];
  });

  it('matches the public print signature', () => {
    expectTypeOf(HttpServer.print).toEqualTypeOf<Http.Lib['print']>();
  });
});
