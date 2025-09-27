/**
 * Represents a generic JSX <Element> (eg. a react component).
 *
 * NOTE:
 *    This is declared explicitly (and abstractly) without reference to
 *    any libraries because Deno fails consistently to import and make
 *    available the JSX types across the monorepo.
 */
export type JSXElement = {
  type: string | Function;
  key?: string | null;
  props: { [key: string]: any };
  children?: JSXElement[];
};
