import React from 'react';

import { type t, Color, css, D, Num, SplitPane, useSizeObserver } from './common.ts';
import { toSidebarConfig } from './u.ts';
import { Footer } from './ui.Footer.tsx';
import { Header } from './ui.Header.tsx';
import { Main } from './ui.Main.tsx';
import { Sidebar } from './ui.Sidebar.tsx';

type P = t.LayoutProps;

export const Body: React.FC<P> = (props) => {
  const { debug = false } = props;
  const theme = Color.theme(props.theme);
  const sidebar = toSidebarConfig(props.sidebar);

  /**
   * Measure the available width for translating a px sidebar width
   * into an initial SplitPane ratio.
   */
  const size = useSizeObserver<HTMLDivElement>();
  const containerW = size.width || 0;

  /**
   * px → ratio (guarded + clamped):
   */
  const sidebarRatio = React.useMemo<t.Percent>(() => {
    if (!sidebar.visible || containerW <= 0) return 0.25;
    const px = sidebar.width ?? D.sidebar.width ?? 0;
    const r = px / Math.max(1, containerW);
    return Num.clamp(0.1, 0.9, r);
  }, [sidebar.visible, sidebar.width, containerW]);

  /**
   * SplitPane defaults/collapse:
   */
  const defaultValue: t.Percent[] =
    sidebar.position === 'left'
      ? [sidebarRatio, 1 - sidebarRatio]
      : [1 - sidebarRatio, sidebarRatio];

  const onlyIndex: t.Index | undefined = sidebar.visible
    ? undefined
    : sidebar.position === 'left'
      ? 1
      : 0;

  /**
   * Styles
   */
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      minHeight: 0,
    }),
    body: css({ minHeight: 0, overflow: 'hidden', display: 'grid' }),
    main: css({ minWidth: 0, minHeight: 0 }),
  };

  const elSidebar = <Sidebar key={'sidebar'} {...props} />;
  const elMain = <Main key={'main'} {...props} style={styles.main} />;

  return (
    <div className={css(styles.base, props.style).class}>
      <Header {...props} />

      <div ref={size.ref} className={styles.body.class}>
        <SplitPane
          orientation={'horizontal'}
          gutter={8}
          active={sidebar.resizable}
          defaultValue={defaultValue}
          onlyIndex={onlyIndex}
          min={0.1}
          debug={debug}
          theme={theme.name}
          children={sidebar.position === 'left' ? [elSidebar, elMain] : [elMain, elSidebar]}
        />
      </div>

      <Footer {...props} />
    </div>
  );
};
