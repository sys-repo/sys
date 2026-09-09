import { type t, css, D } from './common.ts';
import { useTextEllipsize } from './use.TextEllipsize.ts';

export const TextEllipsize: t.FC<t.TextEllipsize.Props> = (props) => {
  const { debug = false } = props;
  const ellipsized = useTextEllipsize(props);

  /**
   * Render:
   */
  const styles = {
    base: css({
      display: 'block',
      width: '100%',
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    }),
    text: css({ whiteSpace: 'inherit' }),
  };

  return (
    <span
      ref={ellipsized.hostRef}
      className={css(styles.base, props.style).class}
      data-component={debug ? D.displayName : undefined}
      title={ellipsized.isEllipsized ? props.text : undefined}
    >
      <span ref={ellipsized.contentRef} className={styles.text.class}>
        {ellipsized.text}
      </span>
    </span>
  );
};
