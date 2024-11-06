import type { t } from './common.ts';

/**
 * <Component>
 */
export type KeyHintProps = {
  text?: string;
  parse?: boolean;
  os?: t.UserAgentOSKind;
  enabled?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * <Component>:Combo  ← Plural
 */
export type KeyHintComboProps = Common & { keys?: string | string[] };
type Common = Pick<KeyHintProps, 'parse' | 'os' | 'enabled' | 'theme' | 'style'>;
