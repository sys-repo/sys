import { type t, css, Color, KeyValue } from './common.ts';

type BodyProps = {
  blocks: readonly t.ActionProbe.ProbeRenderBlock[];
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Body: React.FC<BodyProps> = (props) => {
  const { blocks } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      Padding: 15,
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 8,
    }),
    content: css({ display: 'contents' }),
    item: css({ fontSize: 11, lineHeight: 1.4 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div data-part={'probe-body-content'} className={styles.content.class}>
        {blocks.map((block, index) => {
          if (block.kind === 'element') {
            return (
              <div key={index} className={styles.item.class}>
                {block.node}
              </div>
            );
          }
          return <KeyValue.UI key={index} theme={theme.name} items={block.items} mono={true} />;
        })}
      </div>
    </div>
  );
};
