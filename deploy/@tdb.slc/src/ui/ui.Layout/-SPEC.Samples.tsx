import { type t, css, SheetBase } from './common.ts';
import { Layout } from './m.Layout.tsx';

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
              if (!props.is.top) state.stack.pop(1);
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
        const { index } = props;
        const marginTop = Layout.sheetOffset(index, { base: 44 });
        const onClick = () => {
          if (!props.is.top) props.state.stack.pop();
        };
        return (
          <SheetBase.View style={{ marginTop }} onClick={onClick}>
            <div className={css({ padding: 10 }).class}>
              <div>{`👋 Hello: "${id}" [${props.index}]`}</div>
              <div>{props.children}</div>
            </div>
          </SheetBase.View>
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

  sample2(): t.Content {
    const id = 'sample-3';
    return {
      id,

      render(props) {
        return (
          <SheetBase.View style={{}} orientation={'Top:Down'} edgeMargin={['1pr', 290, '1fr']}>
            <div className={css({ padding: 10 }).class}>
              <div>{`👋 Hello: "${id}" [${props.index}]`}</div>
              <div>{props.children}</div>
            </div>
          </SheetBase.View>
        );
      },
    };
  },
};
