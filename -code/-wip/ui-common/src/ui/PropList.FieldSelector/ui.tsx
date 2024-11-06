import { useEffect, useState } from 'react';
import { Button, COLORS, css, DEFAULTS, KeyboardMonitor, rx, useMouse, type t } from './common.ts';

import { View as PropList } from '../PropList/ui.tsx';
import { Wrangle } from './u.ts';
import { Label } from './ui.Label.tsx';

export const View: React.FC<t.PropListFieldSelectorProps> = (props) => {
  const {
    resettable = DEFAULTS.resettable,
    indexes = DEFAULTS.indexes,
    indent = DEFAULTS.indent,
    theme,
  } = props;
  const selected = Wrangle.fields(props.selected);
  const all = Wrangle.fields([...(props.all ?? [])]);
  const isSelected = (field: string) => selected.includes(field);
  const isDark = theme === 'Dark';

  const mouse = useMouse();
  const [, setCount] = useState(0);
  const redraw = () => setCount((prev: number) => prev + 1);

  /**
   * Ensure redraw when keyboard changes.
   * Used for "resetable" display option.
   */
  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    KeyboardMonitor.$.pipe(
      rx.takeUntil(dispose$),
      rx.filter(() => resettable),
    ).subscribe(() => redraw());
    return dispose;
  }, []);

  /**
   * [Handlers]
   */
  const handleClick = (field: string) => {
    const modifiers = KeyboardMonitor.state.current.modifiers;
    const prev = [...selected];
    const { action, next } = Wrangle.next(all, selected, field, modifiers);
    const args = Wrangle.clickArgs({ field, action, prev, next });
    props.onClick?.(args);
  };

  const handleReset = (e: React.MouseEvent) => {
    const action = e.metaKey ? 'Reset:Clear' : 'Reset:Default';
    const next = e.metaKey ? [] : Wrangle.fields(props.defaults); // NB: force empty if meta-key, otherwise use defaults.
    const payload = Wrangle.clickArgs({ action, prev: selected, next });
    props.onClick?.(payload);
  };

  /**
   * [Render]
   */
  const color = isDark ? COLORS.WHITE : COLORS.DARK;
  const styles = {
    base: css({ position: 'relative', color }),
  };

  const items: t.PropListItem[] = all.map((field) => {
    const onClick = () => handleClick(field);
    const label = (
      <Label
        field={field}
        all={all}
        selected={selected}
        indexes={indexes}
        indent={indent}
        onClick={onClick}
      />
    );
    const value: t.PropListValueSwitch = {
      kind: 'Switch',
      body: isSelected(field),
      indent,
      onClick,
      color: props.switchColor ?? DEFAULTS.switchColor,
    };
    return { label, value };
  });

  if (resettable) {
    const keyboard = KeyboardMonitor.state.current;
    const metaKey = keyboard.modifiers.meta;
    const label = mouse.is.over && metaKey ? DEFAULTS.label.clear : DEFAULTS.label.reset;
    const el = (
      <Button onClick={handleReset} theme={theme}>
        {label}
      </Button>
    );
    items.push({ label: ``, value: el });
  }

  return (
    <div {...css(styles.base, props.style)} {...mouse.handlers}>
      <PropList title={props.title} items={items} theme={theme} />
    </div>
  );
};
