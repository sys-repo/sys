import { type t, Color, css } from './common.ts';

export const Anchor: t.FC<t.Anchor.Props> = (props) => {
  const rel = toRel(props);
  const theme = Color.theme(props.theme);
  const {
    href,
    target,
    title,
    download,
    tabIndex,
    children,
    onClick,
    onMouseDown,
    onMouseUp,
    onKeyDown,
    onKeyUp,
    style,
  } = props;
  const styles = {
    base: css({
      color: 'inherit',
      textDecoration: `underline dashed ${Color.alpha(theme.fg, 0.2)}`,
      textUnderlineOffset: '3px',
      transition: 'text-decoration-color 100ms ease',
      ':hover': { textDecoration: 'underline solid currentColor' },
      ':focus-visible': { textDecoration: 'underline solid currentColor' },
    }),
  };

  return (
    <a
      className={css(styles.base, style).class}
      href={href}
      target={target}
      rel={rel}
      title={title}
      download={download}
      tabIndex={tabIndex}
      aria-disabled={props['aria-disabled']}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      {children}
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
