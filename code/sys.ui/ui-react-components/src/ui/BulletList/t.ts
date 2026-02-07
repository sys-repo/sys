import type { t } from './common.ts';

/**
 * A list of <Bullet>'s.
 */
export namespace BulletList {
  export type Lib = { readonly UI: t.FC<Props> };

  export type Item = {
    id: t.StringId;
    label?: t.ReactNode;
    enabled?: boolean;
  };

  export type Props = {
    items: Item[];
    selected?: t.StringId;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    onSelect?: (e: { id: string }) => void;
  };
}
