import type { t } from './common.ts';

/**
 * Adapts Markdown input into prose semantics without imposing layout or typography.
 */
export namespace ProseMarkdown {
  export type Lib = { readonly UI: t.FC<Props> };

  /** Markdown renderer props. */
  export type Props = {
    /** Markdown source text or already parsed document tree to render. */
    value?: Value;
    /** Component render overrides for supported Markdown semantics. */
    renderers?: Renderers;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /** Markdown renderer input value. Strings are parsed; AST objects render directly. */
  export type Value = t.Markdown.Value;

  /** Component render overrides for supported Markdown semantics. */
  export type Renderers = {
    /** Render an inline-code node. Defaults to a neutral `<code>` element. */
    inlineCode?: Inline.Code.Renderer;
  };

  /** Inline prose semantics. */
  export namespace Inline {
    /** Markdown inline-code semantics. */
    export namespace Code {
      /** Render override. */
      export type Renderer = (args: RendererArgs) => t.ReactNode;

      /** Render override arguments. */
      export type RendererArgs = {
        /** Source inline-code AST node. */
        readonly node: Node;
        /** Inline-code token text. */
        readonly value: string;
      };

      /** Markdown inline-code AST node. */
      export type Node = Extract<t.Markdown.Node, { type: 'inlineCode' }>;
    }
  }
}
