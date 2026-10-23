import type {
  DefaultTreeAdapterMap,
  DefaultTreeAdapterTypes as Tree,
  ParserError,
  ParserErrorHandler,
  ParserOptions,
  Token,
  TreeAdapter,
} from 'parse5';
import type { Html as HtmlTypes } from '@sys/html/t';
import { Html } from '@sys/html';
import { describe, expectTypeOf, it, type t } from '../../-test.ts';

describe('Html public types', () => {
  it('retains upstream node, option, diagnostic and position identities', () => {
    type _ = [
      t.Type.Assert<t.Type.Equal<HtmlTypes.Document, Tree.Document>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.DocumentFragment, Tree.DocumentFragment>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.Node, Tree.Node>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.ParentNode, Tree.ParentNode>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.ChildNode, Tree.ChildNode>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.Element, Tree.Element>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.Template, Tree.Template>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.Attribute, Token.Attribute>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.Location, Token.Location>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.ElementLocation, Token.ElementLocation>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.ParseError, ParserError>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.ParseErrorHandler, ParserErrorHandler>>,
      t.Type.Assert<t.Type.Equal<HtmlTypes.ParseOptions, ParserOptions<DefaultTreeAdapterMap>>>,
      t.Type.Assert<
        t.Type.Equal<
          keyof HtmlTypes.ParseOptions,
          'scriptingEnabled' | 'sourceCodeLocationInfo' | 'treeAdapter' | 'onParseError'
        >
      >,
    ];
  });

  it('specializes parsing to the default tree while preserving both fragment signatures', () => {
    type Fragment = {
      (source: string, options?: HtmlTypes.ParseOptions): HtmlTypes.DocumentFragment;
      (
        context: HtmlTypes.ParentNode | null,
        source: string,
        options: HtmlTypes.ParseOptions,
      ): HtmlTypes.DocumentFragment;
    };
    type OtherTree = Omit<DefaultTreeAdapterMap, 'document'> & { document: { kind: 'other' } };
    type _ = [
      t.Type.Assert<t.Type.Equal<HtmlTypes.ParseFragment, Fragment>>,
      t.Type.Assert<
        t.Type.Equal<
          t.Type.Extends<{ treeAdapter: TreeAdapter<OtherTree> }, HtmlTypes.ParseOptions>,
          false
        >
      >,
      t.Type.Assert<
        t.Type.Equal<
          HtmlTypes.Element['sourceCodeLocation'],
          HtmlTypes.ElementLocation | null | undefined
        >
      >,
    ];
    expectTypeOf(Html).toEqualTypeOf<HtmlTypes.Lib>();
    expectTypeOf(Html.parse('')).toEqualTypeOf<HtmlTypes.Document>();
    expectTypeOf(Html.parseFragment('')).toEqualTypeOf<HtmlTypes.DocumentFragment>();
    expectTypeOf(Html.parseFragment(null, '', {})).toEqualTypeOf<HtmlTypes.DocumentFragment>();
  });

  it('narrows optional nodes through the public guards', () => {
    const fragment = Html.parseFragment('<template></template>');
    const node: HtmlTypes.Node | undefined = fragment.childNodes[0];
    if (Html.Is.element(node)) expectTypeOf(node).toEqualTypeOf<HtmlTypes.Element>();
    if (Html.Is.template(node)) expectTypeOf(node).toEqualTypeOf<HtmlTypes.Template>();
    expectTypeOf(Html.Is.element(null)).toEqualTypeOf<boolean>();
    expectTypeOf(Html.Is.template(undefined)).toEqualTypeOf<boolean>();
  });
});
