import type { t } from './common.ts';

export declare namespace FilesUI {
  export type Lib = { readonly InfoPanel: t.FC<InfoPanelProps> };
  export type InfoPanelProps = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
