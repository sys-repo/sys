import { Color, css, KeyValue, type t } from './common.ts';

/** Callback feedback, separate from the specimen's supplied authentication facts. */
export const Intent: t.FC<t.PasskeyIntentProps> = (props) => {
  const { intent } = props;
  const theme = Color.theme();
  const styles = {
    base: css({ marginTop: 8 }),
  };

  return (
    <div
      role='status'
      aria-label='Captured intent'
      aria-atomic='true'
      className={styles.base.class}
    >
      <KeyValue.UI
        theme={theme.name}
        layout={{ kind: 'table' }}
        items={[
          { id: 'last-intent', k: 'Last intent:', v: intent?.action ?? 'none' },
          { id: 'events', k: 'Events:', v: intent?.count ?? 0 },
        ]}
      />
    </div>
  );
};
