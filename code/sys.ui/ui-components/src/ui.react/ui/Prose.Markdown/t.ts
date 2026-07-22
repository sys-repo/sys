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

  /**
   * Component render overrides for supported Markdown semantics.
   *
   * Extension rule:
   * add future hooks as semantic siblings, not as node-kind catch-alls or
   * call-site-specific shortcuts. Examples: `Inline.Strong.Renderer`,
   * `Inline.Emphasis.Renderer`, `Block.Paragraph.Renderer`,
   * `Block.List.Renderer`, and `Block.ListItem.Renderer`.
   */
  export type Renderers = {
    /** Render an inline-code node. Defaults to a neutral `<code>` element. */
    inlineCode?: Inline.Code.Renderer;
    /** Render a safe link node. Defaults to a neutral `<a>` element. */
    link?: Inline.Link.Renderer;
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

    /** Markdown link semantics. */
    export namespace Link {
      /** Render override. */
      export type Renderer = (args: RendererArgs) => t.ReactNode;

      /** Render override arguments. */
      export type RendererArgs = {
        /** Source link AST node. */
        readonly node: Node;
        /** Safe, policy-accepted href. */
        readonly href: t.StringUri;
        /** Optional link title. */
        readonly title?: string;
        /** Already-rendered link children. */
        readonly children: t.ReactNode;
      };

      /** Markdown link AST node. */
      export type Node = Extract<t.Markdown.Node, { type: 'link' }>;
    }
  }
}
