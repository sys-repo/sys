import React, { useEffect, useRef } from 'react';
import { VscSymbolClass } from 'react-icons/vsc';
import { COLORS, Color, DEFAULTS, css, type t } from './common.ts';
import { Calc } from './u.Calc.ts';

export type ListItemProps = {
  enabled?: boolean;
  index: number;
  url: URL;
  imports: t.ModuleImports;
  uri?: string;
  title?: string;
  selected?: boolean;
  focused: boolean;
  Icon?: t.IconType;
  ns?: boolean;
  hr?: t.ModuleListProps['hr'];
  useAnchorLinks?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onReadyChange?: t.ModuleListItemReadyHandler;
  onClick?: t.ModuleListItemHandler;
  onSelect?: t.ModuleListItemHandler;
};

export const ListItem: React.FC<ListItemProps> = (props) => {
  const { uri, url, selected, focused, enabled = true } = props;
  const { index, Icon, ns } = props;
  const { title, imports, useAnchorLinks = DEFAULTS.useAnchorLinks } = props;
  const importsKeys = Object.keys(imports);

  const beyondBounds = index === -1 ? true : index > importsKeys.length - 1;
  const params = url.searchParams;

  const prev = importsKeys[index - 1];
  const next = importsKeys[index];
  const showHr = !beyondBounds && index > 0 && Calc.showHr(props.hr, prev, next);

  if (uri) params.set(DEFAULTS.qs.dev, uri);
  if (!uri) params.delete(DEFAULTS.qs.dev);

  const baseRef = useRef<HTMLLIElement>(null);

  /**
   * Lifecycle
   */
  useEffect(() => {
    const el = baseRef.current ?? undefined;
    props.onReadyChange?.({ index, lifecycle: 'ready', el });
    return () => {
      props.onReadyChange?.({ index, lifecycle: 'disposed' });
    };
  }, []);

  useEffect(() => {
    if (selected) props.onSelect?.(getArgs());
  }, [selected]);

  /**
   * Handlers
   */
  const getArgs = (): t.ModuleListItemHandlerArgs => ({ index, uri });
  const handleClick = (e: React.MouseEvent) => {
    if (props.onClick) {
      e.preventDefault(); // NB: suppress default <a> click when handler provided.
      props.onClick?.(getArgs());
    }
  };

  /**
   * Render:
   */
  const { WHITE, BLUE } = COLORS;
  const color = Color.theme(props.theme).fg;
  const styles = {
    base: css({
      paddingLeft: beyondBounds ? 0 : 20,
      paddingRight: beyondBounds ? 0 : 50,
    }),
    hr: css({
      border: 'none',
      borderTop: `solid 1px ${Color.alpha(color, 0.12)}`,
    }),
    link: css({
      color: selected && focused && enabled ? WHITE : enabled ? BLUE : Color.alpha(color, 0.15),
      textDecoration: 'none',
      cursor: enabled ? 'pointer' : undefined,
    }),
    linkDimmed: css({
      userSelect: 'none',
      color: Color.alpha(color, 0.4),
      ':hover': { color: BLUE },
    }),
    row: {
      base: css({
        backgroundColor: selected
          ? focused && enabled
            ? BLUE
            : Color.alpha(color, 0.08)
          : undefined,
        borderRadius: 3,
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      }),
      icon: css({
        color: selected && focused && enabled ? WHITE : enabled ? BLUE : Color.alpha(color, 0.15),
        marginLeft: 10,
        marginRight: 10,
        display: 'grid',
        placeItems: 'center',
      }),
      label: css({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        ':hover': { textDecoration: 'underline' },
      }),
    },
  };

  const linkStyle = css(styles.link, !ns ? styles.linkDimmed : undefined);
  const elLink = (
    <a
      href={useAnchorLinks ? url.href : undefined}
      onClick={handleClick}
      className={linkStyle.class}
    >
      <div className={styles.row.label.class}>{title ?? uri}</div>
    </a>
  );

  return (
    <li ref={baseRef} className={css(styles.base, props.style).class}>
      {showHr && <hr className={styles.hr.class} />}
      <div className={styles.row.base.class}>
        <div className={styles.row.icon.class}>{Icon && <VscSymbolClass />}</div>
        {elLink}
        <div style={{ width: 20 }} />
      </div>
    </li>
  );
};
