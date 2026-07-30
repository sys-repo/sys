import { Color, css, D, type t } from './common.ts';
import { renderChildren } from './u/u.render/mod.ts';
import { createStyles } from './u/u.styles.ts';
import { MarkdownValue } from './u/u.value.ts';

type P = t.ProseMarkdown.Props;

export const Markdown: t.FC<P> = (props) => {
  const { debug = false } = props;
  const theme = Color.theme(props.theme);
  const styles = createStyles({ debug, theme });
  const result = MarkdownValue.toAst(props.value);

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {result.kind === 'error'
        ? <div className={styles.error.class} role='alert'>{result.error}</div>
        : renderChildren(result.ast.children, {
          renderers: props.renderers,
          source: result.source,
          styles,
        })}
    </div>
  );
};
