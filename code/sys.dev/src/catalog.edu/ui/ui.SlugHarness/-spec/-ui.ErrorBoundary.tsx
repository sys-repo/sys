import { type FallbackProps, ErrorBoundary as BaseErrorBoundary } from 'react-error-boundary';
import { type t, Button, Color, css, ObjectView } from '../common.ts';

/**
 * TODO 🐷 move error boundary into: @sys/driver-crdt/web/ui/CrdtLayout
 */
export function ErrorBoundary(props: { children?: t.ReactNode; ctx?: t.SlugViewProps }) {
  const { children, ctx } = props;
  const styles = { base: css({ display: 'grid' }) };
  return (
    <div className={styles.base.class}>
      <BaseErrorBoundary fallbackRender={(p: FallbackProps) => <Fallback {...p} ctx={ctx} />}>
        {children}
      </BaseErrorBoundary>
    </div>
  );
}

/**
 * Displayed when error occured.
 */
export function Fallback(props: FallbackProps & { ctx?: t.SlugViewProps }) {
  const { ctx, error, resetErrorBoundary } = props;
  const theme = Color.theme(ctx?.theme);
  const styles = {
    base: css({ padding: 30 }),
    reset: css({ marginTop: 20 }),
  };
  const data = {
    error: {
      message: error?.message,
      stack: error?.stack?.split('\n'),
    },
    ctx,
  };
  return (
    <div className={styles.base.class}>
      <ObjectView
        theme={theme.name}
        name={'Error Boundary'}
        data={data}
        expand={['$', '$.ctx', '$.error']}
      />

      <Button
        theme={theme.name}
        onClick={resetErrorBoundary}
        label={'Reset Error'}
        style={styles.reset}
      />
    </div>
  );
}
