import { type t, css, SheetBase } from './common.ts';

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
            <div>{'props.children 🐷'}</div>
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
        const { state } = props;
        const edge: t.SheetMarginInput =
          state.breakpoint.name === 'Desktop' ? ['1fr', 390, '1fr'] : 10;

        const onClick = () => {
          if (!props.is.top) props.state.stack.pop();
        };

        const styles = { base: css({ padding: 10 }) };

        return (
          <SheetBase.View edgeMargin={edge} onClick={onClick}>
            <div className={styles.base.class}>
              <div>{`👋 Hello: "${id}" [${props.index}]`}</div>
              <div>{'props.children 🐷'}</div>
            </div>
          </SheetBase.View>
        );
      },
    };
  },

  sample2(): t.Content {
    return {
      id: 'sample-2',
      render(props) {
        const { state } = props;
        const breakpoint = state.breakpoint;
        const orientation: t.SheetOrientation = 'Top:Down';
        const edge: t.SheetMarginInput = breakpoint.name === 'Desktop' ? [30, '1fr', 30] : 10;
        const styles = { base: css({ padding: 10 }) };

        return (
          <SheetBase.View orientation={orientation} edgeMargin={edge}>
            <div className={styles.base.class}>
              <div>{`👋 Hello: "${props.content.id}" [${props.index}]`}</div>
              <div>{'props.children 🐷'}</div>
            </div>
          </SheetBase.View>
        );
      },
    };
  },
};
