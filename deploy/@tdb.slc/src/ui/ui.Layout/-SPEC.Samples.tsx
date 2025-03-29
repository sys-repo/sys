import { type t, css, BaseSheet } from './common.ts';
import { Layout } from './mod.ts';

export const Sample = {
  sample0(): t.Content {
    const id = 'sample-0';
    return {
      id,
      render(props) {
        const { state } = props;
        const styles = {
          base: css({
            pointerEvents: 'auto',
            cursor: 'default',
            userSelect: 'none',
            opacity: 0.3,
            padding: 6,
          }),
        };

        return (
          <div
            className={styles.base.class}
            onDoubleClick={() => state.stack.clear(1)}
            onClick={() => {
              if (!props.isTop) state.stack.pop(1);
            }}
          >
            <div>{`id: "${id}"`}</div>
            <div>{props.children}</div>
          </div>
        );
      },
    };
  },

  sample1(): t.Content {
    const id = 'sample-1';
    return {
      id,
      render(props) {
        const marginTop = Layout.sheetOffset(props.index, { base: 30 });
        const onClick = () => {
          if (!props.isTop) props.state.stack.pop();
        };
        return (
          <BaseSheet style={{ padding: 10, marginTop }} onClick={onClick}>
            <div>
              <div>{`👋 Hello: ${props.index}`}</div>
              <div>{props.children}</div>
            </div>
          </BaseSheet>
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
