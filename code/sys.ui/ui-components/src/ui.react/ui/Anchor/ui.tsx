import { Color, css, D, type t, usePointer } from './common.ts';
import { focusStyle } from './u.focus.ts';
import { Content } from './ui.Content.tsx';

type AnchorLinkProps = t.Anchor.Props & { href: string };

const truncation: t.CssValue = {
  display: 'inline-block',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};

export const Anchor: t.FC<t.Anchor.Props> = (props) => {
  const href = props.href;
  if (!href) return props.children;
  const enabled = props.enabled ?? D.enabled;
  if (!enabled) return <AnchorLinkDisabled {...props} href={href} />;
  return <AnchorLinkEnabled {...props} href={href} />;
};

const AnchorLinkEnabled: t.FC<AnchorLinkProps> = (props) => {
  const pointer = usePointer();
  const theme = Color.theme(props.theme);
  const { href, title, tabIndex, style } = props;
  const target = props.target ?? D.target;
  const download = props.download ?? D.download;
  const rel = toRel({ ...props, target });
  const underline = Color.alpha(theme.fg, theme.is.dark ? 0.35 : 0.25);
  const styles = {
    base: css({
      color: 'inherit',
      textDecoration: `underline dashed ${underline}`,
      textUnderlineOffset: '3px',
      transition: 'text-decoration-color 100ms ease',
      transform: `translateY(${pointer.is.down ? 1 : 0}px)`,
      ':hover': { textDecoration: 'underline solid currentColor' },
    }),
  };
  const focus = focusStyle([styles.base, (props.truncate ?? D.truncate) && truncation], style);

  return (
    <a
      className={focus.class}
      href={href}
      target={target}
      rel={rel}
      title={title}
      download={download}
      tabIndex={tabIndex}
      aria-disabled={props['aria-disabled']}
      aria-describedby={props['aria-describedby']}
      {...pointer.handlers}
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onKeyDown={props.onKeyDown}
      onKeyUp={props.onKeyUp}
    >
      <Content icons={props.icons}>{props.children}</Content>
    </a>
  );
};

const AnchorLinkDisabled: t.FC<AnchorLinkProps> = (props) => {
  const { title, style } = props;
  const opacity = props.disabledOpacity === false
    ? undefined
    : (props.disabledOpacity ?? D.disabledOpacity);
  const styles = {
    base: css({
      color: 'inherit',
      textDecoration: 'none',
      opacity,
      cursor: 'default',
    }),
  };

  const onClick = (e: t.ReactMouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onKeyDown = (e: t.ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <a
      className={css(styles.base, (props.truncate ?? D.truncate) && truncation, style).class}
      href={undefined}
      target={undefined}
      rel={undefined}
      title={title}
      download={undefined}
      tabIndex={-1}
      aria-disabled
      aria-describedby={props['aria-describedby']}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <Content icons={props.icons}>{props.children}</Content>
    </a>
  );
};

/**
 * Helpers
 */
function toRel(props: t.Anchor.Props): string | undefined {
  if (props.target !== '_blank') return props.rel;
  // Security: harden new-tab links against opener access / tabnabbing.
  return mergeRel(props.rel, 'noopener noreferrer');
}

function mergeRel(left: string = '', right: string = ''): string | undefined {
  const values = `${left} ${right}`
    .trim()
    .split(/\s+/)
    .filter((value) => value.length > 0);
  if (values.length === 0) return;
  return [...new Set(values)].join(' ');
}
