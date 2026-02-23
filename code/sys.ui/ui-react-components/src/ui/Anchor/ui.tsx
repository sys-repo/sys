import { type t, Color, css, D, usePointer } from './common.ts';

export const Anchor: t.FC<t.Anchor.Props> = (props) => {
  const href = props.href;
  if (!href) return props.children;
  return <AnchorLink {...props} href={href} />;
};

type AnchorLinkProps = t.Anchor.Props & { href: string };

const AnchorLink: t.FC<AnchorLinkProps> = (props) => {
  const pointer = usePointer();
  const theme = Color.theme(props.theme);
  const { href, title, tabIndex, children, style } = props;
  const target = props.target ?? D.target;
  const download = props.download ?? D.download;
  const rel = toRel({ ...props, target });
  const styles = {
    base: css({
      color: 'inherit',
      textDecoration: `underline dashed ${Color.alpha(theme.fg, 0.2)}`,
      textUnderlineOffset: '3px',
      transition: 'text-decoration-color 100ms ease',
      transform: `translateY(${pointer.is.down ? 1 : 0}px)`,
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
      {...pointer.handlers}
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onKeyDown={props.onKeyDown}
      onKeyUp={props.onKeyUp}
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
