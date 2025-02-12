import { useEffect, useRef } from 'react';
import { Color, DEFAULTS, css, useRubberband, type t } from './common.ts';
import { Footer } from './ui.Footer.tsx';
import { List } from './ui.List.tsx';
import { Title } from './ui.Title.tsx';
import { useScrollController } from './use.ScrollController.ts';
import { useScrollObserver } from './use.ScrollObserver.ts';

type LiMap = Map<number, HTMLLIElement>;

export const View: React.FC<t.ModuleListProps> = (props) => {
  const { theme, scroll = false, focused = true, enabled = true } = props;
  const url = new URL(props.href ?? window.location.href);
  const imports = (props.imports ?? {}) as t.ModuleImports;

  const baseRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<LiMap>(new Map<number, HTMLLIElement>());

  useRubberband(props.allowRubberband ?? false);
  useScrollObserver(baseRef, itemRefs.current, props.onItemVisibility);
  useScrollController(baseRef, itemRefs.current, props.scrollTo$);

  /**
   * Lifecycle
   */
  useEffect(() => {
    if (!enabled) return;
    const i = props.selectedIndex;
    const isUnselected = i === undefined || (typeof i === 'number' && i < 0);
    if (isUnselected) props.onItemSelect?.({ index: -1 });
  }, [props.selectedIndex, enabled]);

  /**
   * Handlers
   */
  const handleItemReadyChange: t.ModuleListItemReadyHandler = (e) => {
    const map = itemRefs.current;
    if (e.lifecycle === 'ready') map.set(e.index, e.el!);
    if (e.lifecycle === 'disposed') map.delete(e.index);
  };

  /**
   * Render
   */
  const color = Color.theme(theme).fg;
  const styles = {
    base: css({
      position: 'relative',
      Scroll: scroll,
      Absolute: scroll ? 0 : undefined,
      pointerEvents: enabled ? 'auto' : 'none',
    }),
    body: css({
      position: 'relative',
      cursor: 'default',
      fontFamily: 'sans-serif',
      lineHeight: '2em',
      color,
      boxSizing: 'border-box',
      padding: 30,
      paddingTop: 20,
    }),
    title: css({ marginBottom: 20 }),
    list: {
      outer: css({ marginTop: 30, display: 'grid' }),
      inner: css({ minWidth: props.listMinWidth ?? DEFAULTS.list.minWidth, MarginX: 50 }),
    },
  };

  const elList = (
    <div style={styles.list.outer}>
      <div style={styles.list.inner}>
        <List
          url={url}
          imports={imports}
          theme={theme}
          enabled={enabled}
          selectedIndex={props.selectedIndex}
          focused={focused}
          hrDepth={props.hrDepth}
          useAnchorLinks={props.useAnchorLinks}
          showParamDev={props.showParamDev}
          onItemReadyChange={handleItemReadyChange}
          onItemClick={props.onItemClick}
          onItemSelect={props.onItemSelect}
        />
      </div>
    </div>
  );

  const elBody = (
    <div style={styles.body}>
      <Title
        enabled={enabled}
        title={props.title}
        version={props.version}
        badge={props.badge}
        theme={theme}
        style={styles.title}
      />
      {elList}
      <Footer theme={theme} enabled={enabled} />
    </div>
  );

  return (
    <div ref={baseRef} style={css(styles.base, props.style)}>
      {elBody}
    </div>
  );
};
