import { type t, css, M, AnimatePresence, Color, MobileSheet } from './common.ts';
import { Layout } from './mod.ts';

export const Sample = {
  content0(): t.Content {
    const id = 'content-0';
    return {
      id,
      render(props) {
        const { state } = props;
        const styles = {
          base: css({ pointerEvents: 'auto', cursor: 'default', userSelect: 'none' }),
        };

        return (
          <div
            className={styles.base.class}
            onDoubleClick={() => state.stack.clear(1)}
            onClick={() => {
              if (!props.isTop) state.stack.pop();
            }}
          >
            <div>{`id: ${id}`}</div>
            <div>{props.children}</div>
          </div>
        );
      },
    };
  },

  content1(): t.Content {
    const id = 'content-1';
    return {
      id,
      render(props) {
        const marginTop = Layout.sheetOffset(props.index);
        const onClick = () => {
          if (!props.isTop) props.state.stack.pop();
        };
        return (
          <MobileSheet style={{ padding: 10, marginTop }} onClick={onClick}>
            <div>
              <div>{`👋 Hello: ${props.index}`}</div>
              <div>{props.children}</div>
            </div>
          </MobileSheet>
        );
      },
      timestamps: {
        '00:00:00.000': {
          render(props) {
            return <div>timestamp: {props.timestamp}</div>;
          },
        },
      },
    };
  },
};
