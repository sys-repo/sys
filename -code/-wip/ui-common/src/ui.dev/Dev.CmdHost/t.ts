import type { t } from './common.ts';

/**
 * <Component>
 */
export type CmdHostProps = {
  pkg?: { name: string; version: string };
  imports?: t.ModuleImports;
  command?: string;
  commandPlaceholder?: string;
  commandPrefix?: t.CmdBarProps['prefix'];
  commandSuffix?: t.CmdBarProps['suffix'];
  filter?: t.CmdHostFilter | null;
  selected?: string;
  hintKey?: string | string[];
  hrDepth?: number;
  badge?: t.ImageBadge;
  enabled?: boolean;
  focused?: boolean;
  showParamDev?: boolean;
  showCommandbar?: boolean;
  autoGrabFocus?: boolean;
  useAnchorLinks?: boolean;
  listMinWidth?: number;
  listEnabled?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
  focusOnReady?: boolean;
  focusOnClick?: boolean;
  scrollTo$?: t.Observable<t.ModuleListScrollTarget>;
  onReady?: CmdHostReadyHandler;
  onChanged?: CmdHostChangedHandler;
  onCmdFocusChange?: t.TextInputFocusHandler;
  onKeyDown?: t.TextInputKeyHandler;
  onKeyUp?: t.TextInputKeyHandler;
  onItemVisibility?: t.ModuleListItemVisibilityHandler;
  onItemInvoke?: t.ModuleListItemHandler;
  onItemSelect?: t.ModuleListItemHandler;
};

export type CmdHostFilter = (imports: t.ModuleImports, command?: string) => t.ModuleImports;

/**
 * Events
 */
export type CmdHostChangedHandler = (e: CmdHostChangedHandlerArgs) => void;
export type CmdHostChangedHandlerArgs = { command: string };

export type CmdHostReadyHandler = (e: CmdHostReadyHandlerArgs) => void;
export type CmdHostReadyHandlerArgs = { textbox: t.TextInputRef };
