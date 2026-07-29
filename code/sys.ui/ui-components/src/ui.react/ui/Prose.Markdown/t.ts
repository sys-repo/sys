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

  /** Resolved style map shared by Markdown rendering helpers. */
  export type Styles = {
    readonly base: t.Style.Transform.Result;
    readonly paragraph: t.Style.Transform.Result;
    readonly heading: t.Style.Transform.Result;
    readonly list: t.Style.Transform.Result;
    readonly listItem: t.Style.Transform.Result;
    readonly taskListItem: t.Style.Transform.Result;
    readonly taskRow: t.Style.Transform.Result;
    readonly taskState: t.Style.Transform.Result;
    readonly taskCheckbox: t.Style.Transform.Result;
    readonly taskBody: t.Style.Transform.Result;
    readonly strong: t.Style.Transform.Result;
    readonly emphasis: t.Style.Transform.Result;
    readonly link: t.Style.Transform.Result;
    readonly inlineCode: t.Style.Transform.Result;
    readonly error: t.Style.Transform.Result;
  };

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
    /** Render a semantic heading. Defaults to the corresponding native heading element. */
    heading?: Block.Heading.Renderer;
    /** Render a semantic thematic break. Defaults to a native `<hr>` element. */
    thematicBreak?: Block.ThematicBreak.Renderer;
    /** Render validated task-list state. Defaults to a read-only native checkbox. */
    taskState?: Block.TaskState.Renderer;
  };

  /** Block prose semantics. */
  export namespace Block {
    /**
     * Markdown heading semantics.
     */
    export namespace Heading {
      /** Render override. */
      export type Renderer = (args: RendererArgs) => t.ReactNode;

      /** Render override arguments. */
      export type RendererArgs = {
        /** Source heading AST node. */
        node: Node;
        /** Canonical heading depth. */
        depth: Node['depth'];
        /** Already-rendered heading children. */
        children: t.ReactNode;
      };

      /** Markdown heading AST node. */
      export type Node = Extract<t.Markdown.Node, { type: 'heading' }>;
    }

    /**
     * Markdown thematic-break semantics.
     */
    export namespace ThematicBreak {
      /** Render override. */
      export type Renderer = (args: RendererArgs) => t.ReactNode;

      /** Render override arguments. */
      export type RendererArgs = {
        /** Source thematic-break AST node. */
        node: Node;
        /** Exact source lexeme when the renderer received source text rather than a bare AST. */
        lexeme?: t.Markdown.Source.ThematicBreakLexeme;
      };

      /** Markdown thematic-break AST node. */
      export type Node = Extract<t.Markdown.Node, { type: 'thematicBreak' }>;
    }

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
        node: Node;
        /** Canonical checked state projected from the AST. */
        checked: boolean;
        /** Accessible state label used by the default renderer. */
        ariaLabel: string;
      };

      /** Markdown task-list item AST node with validated checked state. */
      export type Node = Extract<t.Markdown.Node, { type: 'listItem' }> & {
        checked: boolean;
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
        node: Node;
        /** Inline-code token text. */
        value: string;
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
        node: Node;
        /** Safe, policy-accepted href. */
        href: t.StringUri;
        /** Optional link title. */
        title?: string;
        /** Already-rendered link children. */
        children: t.ReactNode;
      };

      /** Markdown link AST node. */
      export type Node = Extract<t.Markdown.Node, { type: 'link' }>;
    }
  }
}
