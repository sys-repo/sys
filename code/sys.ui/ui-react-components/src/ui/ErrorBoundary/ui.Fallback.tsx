import React from 'react';
import { type t, Button, Color, css, Icons, ObjectView, Time } from './common.ts';
import { copyToClipboard } from './u.clipboard.ts';

export type P = t.ErrorBoundaryFallbackProps;

/**
 * Component:
 */
export const ErrorBoundaryFallback: React.FC<P> = (props) => {
  const { error } = props;

  /**
   * Hooks:
   */
  const [copied, setCopied] = React.useState(false);

  /**
   * Handlers:
   */
  function handleCopy() {
    copyToClipboard(props.error);
    setCopied(true);
    Time.delay(1200, () => setCopied(false));
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ MarginX: 50, display: 'grid', alignContent: 'center' }),
    titleBar: css({
      fontSize: 18,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      borderBottom: `solid 2px ${Color.alpha(theme.fg, 0.1)}`,
      paddingBottom: 12,
      marginBottom: 15,
    }),
    title: css({
      display: 'grid',
      gridTemplateColumns: 'auto auto',
      columnGap: 8,
    }),
    body: css({
      backgroundColor: Color.alpha(Color.MAGENTA, 0.1),
      border: `solid 1px ${Color.alpha(Color.MAGENTA, 0.1)}`,
      backdropFilter: 'blur(5px)',
      padding: 20,
      borderRadius: 6,
      minWidth: 260,
    }),
  };

  const data = {
    message: error?.message,
    stack: error?.stack?.split('\n'),
  };

  return (
    <div className={styles.base.class}>
      <div className={styles.body.class}>
        <div className={styles.titleBar.class}>
          <Button theme={theme.name} onClick={handleCopy}>
            <div className={styles.title.class}>
              <Icons.Copy.Basic size={20} />
              <div>{copied ? 'Copied' : `Uncaught Error`}</div>
            </div>
          </Button>
          <div />
          <Button label={'(reset)'} theme={theme.name} onClick={() => props.resetErrorBoundary()} />
        </div>
        <ObjectView
          theme={theme.name}
          name={'Error'}
          data={data}
          expand={['$', '$.ctx', '$.error']}
        />
      </div>
    </div>
  );
};
