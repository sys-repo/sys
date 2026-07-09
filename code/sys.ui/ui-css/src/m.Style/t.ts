import type { CSSProperties } from 'react';
import type { t } from './common.ts';
import type * as TTransform from './t.transform.ts';

type CssVars = { [K in `--${string}`]?: string | number };

type NamespaceLibs = {
  /** Tools for working with colors. */
  readonly Color: t.Color.Lib;

  /** Tools for working with edges. */
  readonly Edges: t.CssEdges.Lib;

  /** Tools for working with templates. */
  readonly Tmpl: t.CssTmpl.Lib;

  /** Tools for programatically managing CSS stylesheets within the browser DOM. */
  readonly Dom: t.CssDom.Lib;
};

/**
 * CSS styling contracts.
 */
export declare namespace Style {
  /**
   * Runtime library surface.
   */
  export type Lib = NamespaceLibs & {
    /** Perform a transformation on a loose set of CSS inputs. */
    readonly css: Transform.Fn;

    /** Factory to produce `transform` function scoped to the given prefix. */
    transformer(options?: TransformerOptions): Transform.Fn;

    /** Transform margin spacing. */
    readonly toMargins: t.CssEdges.Lib['toMargins'];

    /** Transform padding spacing. */
    readonly toPadding: t.CssEdges.Lib['toPadding'];

    /** Transform shadow settings. */
    readonly toShadow: Shadow.ToString;

    /** Convert a {style} props object to a CSS string. */
    toString(style?: Value): string;

    /** Determine if the CSS value input amounts to 0. */
    isZero(value?: NumberOrStringInput): boolean;
  };

  /** CSS value accepted as a number, string, or nullish input. */
  export type NumberOrStringInput = number | string | null | undefined;

  /** Standard CSS properties with CSS custom-property support. */
  export type Props = CSSProperties & CssVars;

  /** Standard CSS properties with CSS-template extensions. */
  export type Value = Props & t.CssDom.PseudoClass.Map & t.CssTmpl.Templates;

  /** Loose CSS transform input. */
  export type Input = Value | undefined | null | false | never | Transform.Result | Input[];

  /** A CSS class-name. */
  export type Classname = string;

  /** CSS class prefix. */
  export type ClassPrefix = string;

  /** Options passed to `Style.transformer` factory function. */
  export type TransformerOptions = { sheet?: t.CssDom.Stylesheet };

  /**
   * CSS transform contracts.
   */
  export namespace Transform {
    /** Flags indicating the kind of string to export from the `toString` method. */
    export type ToStringKind = TTransform.ToStringKind;

    /** Function that transforms CSS inputs into an applicable style object. */
    export type Fn = TTransform.Fn;

    /** A transformed CSS properties object. */
    export type Result = TTransform.Result;

    /** Specialized @container block API for the `Style.Transform.Fn` result. */
    export type ContainerBlock = TTransform.ContainerBlock;
  }

  /**
   * Box-shadow contracts.
   */
  export namespace Shadow {
    /** Converts a shadow input to a CSS box-shadow string. */
    export type ToString = (input?: Input) => string | undefined;

    /** Shadow input. */
    export type Input = {
      color: number | string;
      blur: number;
      x?: number;
      y?: number;
      inner?: boolean;
    };
  }
}
