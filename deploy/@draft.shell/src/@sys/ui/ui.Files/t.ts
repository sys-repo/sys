import type { t } from './common.ts';

export declare namespace FileInfoPanel {
  export type Lib = { readonly InfoPanel: t.FC<Props> };
  export type Transport = 'local' | 'transport' | 'websocket';
  export type Props = {
    title?: string;
    transport?: Transport;
    endpoint?: t.StringUrl | URL;
    path?: t.Files.String.Path;
    status?: t.Service.State;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
