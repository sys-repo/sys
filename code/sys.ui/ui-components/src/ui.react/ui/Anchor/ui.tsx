import { useFocusBox } from '../../use.FocusBox.ts';
import { D, type t } from './common.ts';
import { linkAppearance } from './u.linkAppearance.ts';
import { Content } from './ui.Content.tsx';

type AnchorLinkProps = t.Anchor.Props & { href: string };

export const Anchor: t.FC<t.Anchor.Props> = (props) => {
  const href = props.href;
  if (!href) return props.children;
  const enabled = props.enabled ?? D.enabled;
  if (!enabled) return <AnchorLinkDisabled {...props} href={href} />;
  return <AnchorLinkEnabled {...props} href={href} />;
};

const AnchorLinkEnabled: t.FC<AnchorLinkProps> = (props) => {
  const appearance = linkAppearance(props);
  const { ref, indicator } = useFocusBox(appearance.compact);
  const { href, title, tabIndex } = props;
  const target = props.target ?? D.target;
  const download = props.download ?? D.download;
  const rel = toRel({ ...props, target });

  return (
    <a
      ref={ref}
      className={appearance.class}
      href={href}
      target={target}
      rel={rel}
      title={title}
      download={download}
      tabIndex={tabIndex}
      aria-disabled={props['aria-disabled']}
      aria-describedby={props['aria-describedby']}
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onKeyDown={props.onKeyDown}
      onKeyUp={props.onKeyUp}
    >
      <Content icons={props.icons}>{props.children}</Content>
      {indicator}
    </a>
  );
};

const AnchorLinkDisabled: t.FC<AnchorLinkProps> = (props) => {
  const { title } = props;
  const appearance = linkAppearance(props);

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
      className={appearance.class}
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
