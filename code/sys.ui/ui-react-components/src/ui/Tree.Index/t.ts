import type { t } from './common.ts';

/**
 * Index Tree library API:
 */
export type IndexTreeLib = Readonly<{
  View: React.FC<t.IndexTreeProps>;
  Item: Readonly<{
    View: React.FC<t.IndexTreeItemProps>;
  }>;
}>;

/**
 * Component:
 */
export type IndexTreeProps = {
  minWidth?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
