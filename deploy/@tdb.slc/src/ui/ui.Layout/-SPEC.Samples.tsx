import { type t, css, M, AnimatePresence, Color } from './common.ts';

export const Sample = {
  content0(): t.Content {
    const id = 'content-0';
    return {
      id,
      render(props) {
        const styles = {
          base: css({}),
        };

        return (
          <div className={styles.base.class}>
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
        return <Panel theme={props.theme}>{props.children}</Panel>;

        const styles = {
          base: css({
            backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
            backdropFilter: 'blur(3px)',
            display: 'grid',
          }),
        };

        return (
          <div className={styles.base.class}>
            <div>{`id: ${id} | index-${props.index}`}</div>
            {/* <div>{props.children}</div> */}
            <AnimatePresence>
              <Panel theme={props.theme}>{props.children}</Panel>
            </AnimatePresence>
          </div>
        );
      },
      timestamps: {
        '00:00:00.000': {
          render(props) {
            console.log('props', props);
            return <div>timestamp: {props.timestamp}</div>;
          },
        },
      },
    };
  },
};

export type PanelProps = {
  children?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component: Name
 *
 * This component animates its vertical position on mount and unmount.
 * It slides up from the bottom (entry) and slides down off-screen (exit).
 *
 * Note: For the exit animation to run, ensure that this component is
 * conditionally rendered inside an AnimatePresence wrapper.
 */
export const Panel: React.FC<PanelProps> = (props) => {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)', // RED
      color: theme.fg,
      overflow: 'hidden',
      backdropFilter: 'blur(5px)',
    }),
  };

  return (
    <M.div
      className={css(styles.base, props.style).class}
      initial={{ y: '100%' }} // Offscreen (bottom)
      animate={{ y: '0%' }} // Slide into view
      exit={{ y: '100%' }} // Slide back down when unmounting
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {props.children}
    </M.div>
  );
};
