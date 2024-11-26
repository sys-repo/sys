import { useEffect, useRef, useState } from 'react';
import { CmdBar, Color, DEFAULTS, ModuleList, css, type t } from './common';
import { useKeyboard } from './use.Keyboard';

export const View: React.FC<t.CmdHostProps> = (props) => {
  const {
    pkg = DEFAULTS.pkg,
    enabled = true,
    listEnabled = true,
    focusOnClick = DEFAULTS.focusOnClick,
    showCommandbar: commandbarVisible = DEFAULTS.showCommandbar,
  } = props;
  const imports = wrangle.filteredImports(props);
  const selectedIndex = wrangle.selectedIndex(imports, props.selected);

  const readyRef = useRef(false);
  const [textbox, setTextbox] = useState<t.TextInputRef>();
  const cmdbarRef = useRef(CmdBar.Ctrl.create());
  const cmdbar = cmdbarRef.current;

  useKeyboard(textbox, {
    enabled,
    autoGrabFocus: props.autoGrabFocus,
    onArrowKey: () => textbox?.focus(),
    onClear: () => handleFilterChanged(''),
  });

  /**
   * Lifecycle
   */
  useEffect(() => {
    if (textbox && !readyRef.current) {
      readyRef.current = true;
      props.onReady?.({ textbox });
    }
  }, [!!textbox]);

  /**
   * Handlers
   */
  const handleFilterChanged = (command: string) => props.onChanged?.({ command });
  const handleClick = () => {
    if (focusOnClick && textbox) textbox.focus();
  };

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const color = theme.fg;
  const borderTop = theme.is.dark ? `solid 1px ${Color.format(0.15)}` : undefined;
  const styles = {
    base: css({ position: 'relative', display: 'grid', gridTemplateRows: '1fr auto', color }),
    body: css({ userSelect: 'none', position: 'relative', display: 'grid' }),
    bar: css({ display: 'grid', borderTop }),
  };

  const elCmdBar = commandbarVisible && (
    <div {...styles.bar}>
      <CmdBar
        cmd={CmdBar.Ctrl.toCmd(cmdbar)}
        enabled={enabled}
        text={props.command}
        placeholder={props.commandPlaceholder}
        hintKey={props.hintKey}
        prefix={props.commandPrefix}
        suffix={props.commandSuffix}
        focusOnReady={props.focusOnReady ?? true}
        onReady={(e) => setTextbox(e.textbox)}
        onChange={(e) => handleFilterChanged(e.to)}
        onFocusChange={props.onCmdFocusChange}
        onKeyDown={props.onKeyDown}
        onKeyUp={props.onKeyUp}
      />
    </div>
  );

  return (
    <div {...css(styles.base, props.style)} onClick={handleClick}>
      <div {...styles.body}>
        <ModuleList
          title={pkg.name}
          version={pkg.version}
          imports={imports}
          badge={props.badge}
          hrDepth={props.hrDepth}
          showParamDev={props.showParamDev}
          focused={props.focused}
          enabled={enabled && listEnabled}
          theme={props.theme}
          useAnchorLinks={props.useAnchorLinks}
          listMinWidth={props.listMinWidth}
          scroll={true}
          scrollTo$={props.scrollTo$}
          selectedIndex={selectedIndex}
          onItemVisibility={props.onItemVisibility}
          onItemClick={props.onItemInvoke}
          onItemSelect={props.onItemSelect}
        />
      </div>
      {elCmdBar}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  selectedIndex(specs?: t.ModuleImports, selected?: string) {
    if (!specs || !selected) return;
    return Object.keys(specs).indexOf(selected);
  },
  filteredImports(props: t.CmdHostProps) {
    const { filter = DEFAULTS.filter, imports, command } = props;
    if (!imports || filter === null) return imports;
    return filter(imports, command);
  },
} as const;
