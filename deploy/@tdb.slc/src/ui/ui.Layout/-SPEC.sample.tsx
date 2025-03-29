import { type t, css } from './common.ts';

export const SAMPLE = {
  get content1(): t.Content {
    const id = 'content-1';
    return {
      id,
      render(props) {
        const styles = {
          base: css({
            backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
          }),
        };

        return (
          <div className={styles.base.class}>
            <div>{`id: ${id} | index-${props.index}`}</div>
            <div>{props.children}</div>
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
