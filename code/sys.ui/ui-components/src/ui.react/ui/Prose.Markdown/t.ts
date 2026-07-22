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
    /** Render validated task-list state. Defaults to a read-only native checkbox. */
    taskState?: Block.TaskState.Renderer;
  };

  /** Block prose semantics. */
  export namespace Block {
    /** GFM task-list checked-state semantics. */
    export namespace TaskState {
      /**
       * Render override.
       * The caller owns accessibility and interaction semantics for returned content.
       */
      export type Renderer = (args: RendererArgs) => t.ReactNode;

      /** Render override arguments. */
      export type RendererArgs = {
        /** Source task-list item AST node with validated checked state. */
        readonly node: Node;
        /** Canonical checked state projected from the AST. */
        readonly checked: boolean;
        /** Accessible state label used by the default renderer. */
        readonly ariaLabel: string;
      };

      /** Markdown task-list item AST node with validated checked state. */
      export type Node = Extract<t.Markdown.Node, { type: 'listItem' }> & {
        readonly checked: boolean;
      };
    }
  }

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
