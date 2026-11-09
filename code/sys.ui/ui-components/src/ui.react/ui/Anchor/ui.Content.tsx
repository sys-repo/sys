import { css, D, type t } from './common.ts';

type Props = Pick<t.Anchor.Props, 'children' | 'icons'>;
type Position = 'leading' | 'trailing';

/** Shared inline content; unadorned anchors retain their original child markup. */
export function Content(props: Props) {
  const { children, icons } = props;
  if (!icons?.leading && !icons?.trailing) return children;
  return <>{marker(icons.leading, 'leading')}{children}{marker(icons.trailing, 'trailing')}</>;
}

/**
 * Helpers:
 */
function marker(Renderer: t.IconRenderer | undefined, position: Position) {
  if (!Renderer) return null;
  const style = css({
    display: 'inline-block',
    lineHeight: 0,
    verticalAlign: '-0.125em',
    // Logical margins need explicit units in the CSS serializer.
    [position === 'leading' ? 'marginInlineEnd' : 'marginInlineStart']: `${D.iconGap[position]}px`,
  });
  return (
    <span aria-hidden='true' className={style.class}>
      <Renderer as='span' size={D.iconSize} />
    </span>
  );
}
